#![feature(vec_into_raw_parts)]
#![feature(cell_update)]

use std::cell::Cell;
use std::ffi::CString;
use std::fmt::Debug;
use std::os::raw::{c_char, c_uchar, c_void};
use std::ptr;
use std::slice::from_raw_parts;
use std::str;
use std::sync::OnceLock;
#[cfg(all(debug_assertions, feature = "milo_debug_loop"))]
use std::time::Instant;

#[allow(unused_imports)]
use js_sys::{Function, Uint8Array};
use milo_parser_macros::*;
#[allow(unused_imports)]
use wasm_bindgen::prelude::*;

/// cbindgen:ignore
#[cfg(not(target_family = "wasm"))]
pub mod test_utils;

errors!(
  NONE,
  UNEXPECTED_DATA,
  UNEXPECTED_EOF,
  CALLBACK_ERROR,
  UNEXPECTED_CHARACTER,
  UNEXPECTED_CONTENT_LENGTH,
  UNEXPECTED_TRANSFER_ENCODING,
  UNEXPECTED_CONTENT,
  UNTRAILERS,
  INVALID_VERSION,
  INVALID_STATUS,
  INVALID_CONTENT_LENGTH,
  INVALID_TRANSFER_ENCODING,
  INVALID_CHUNK_SIZE,
  MISSING_CONNECTION_UPGRADE,
  UNSUPPORTED_HTTP_VERSION
);

callbacks!(
  before_state_change,
  after_state_change,
  on_error,
  on_finish,
  on_message_start,
  on_message_complete,
  on_request,
  on_response,
  on_reset,
  on_method,
  on_url,
  on_protocol,
  on_version,
  on_status,
  on_reason,
  on_header_name,
  on_header_value,
  on_headers,
  on_connect,
  on_upgrade,
  on_chunk_length,
  on_chunk_extension_name,
  on_chunk_extension_value,
  on_body,
  on_data,
  on_trailer_name,
  on_trailer_value,
  on_trailers
);

mixin!(store_parsed_http_version, {
  if data[0] == char!('1') {
    parser.version_major.set(1);
    parser.version_minor.set(1);
  } else {
    parser.version_major.set(2);
    parser.version_minor.set(0);
  }
});

// #region general
// Depending on the mode flag, choose the initial state
state!(start, {
  match parser.mode.get() {
    AUTODETECT => move_to!(message, 0),
    REQUEST => {
      parser.message_type.set(REQUEST);
      callback!(on_message_start);
      callback!(on_request);
      move_to!(request, 0)
    }
    RESPONSE => {
      parser.message_type.set(RESPONSE);
      callback!(on_message_start);
      callback!(on_response);
      move_to!(response, 0)
    }
    _ => fail!(UNEXPECTED_CHARACTER, "Invalid mode"),
  }
});

state!(finish, { 0 });

state!(error, { 0 });

// Autodetect if there is a HTTP/RTSP method or a response
state!(message, {
  match data {
    crlf!() => 2, // RFC 9112 section 2.2,
    string!("HTTP/") | string!("RTSP/") => {
      parser.message_type.set(RESPONSE);
      callback!(on_message_start);
      callback!(on_response);
      move_to!(response, 0)
    }
    method!() => {
      parser.message_type.set(REQUEST);
      callback!(on_message_start);
      callback!(on_request);
      move_to!(request, 0)
    }
    otherwise!(5) => fail!(UNEXPECTED_CHARACTER, "Unexpected data"),
    _ => suspend!(),
  }
});
// #endregion general

// #region request - Request line parsing
// RFC 9112 section 3
state!(request, {
  match data {
    crlf!() => 2, // RFC 9112 section 2.2 - Repeated
    [token!(), ..] => move_to!(request_method, 0),
    otherwise!(2) => fail!(UNEXPECTED_CHARACTER, "Expected method"),
    _ => suspend!(),
  }
});

// RFC 9112 section 3.1
state!(request_method, {
  consume!(token);

  match data[consumed] {
    char!(' ') if consumed > 0 => {
      find_method!(&data[..consumed]);
      parser.method.set(method);

      callback!(on_method, consumed);
      move_to!(request_url, consumed + 1)
    }
    _ => fail!(UNEXPECTED_CHARACTER, "Expected token character"),
  }
});

// RFC 9112 section 3.2
state!(request_url, {
  consume!(url);

  match data[consumed] {
    char!(' ') if consumed > 0 => {
      callback!(on_url, consumed);
      move_to!(request_protocol, consumed + 1)
    }
    _ => fail!(UNEXPECTED_CHARACTER, "Expected URL character"),
  }
});

// RFC 9112 section 2.3
state!(request_protocol, {
  match data {
    string!("HTTP/") | string!("RTSP/") => {
      callback!(on_protocol, 4);
      parser.position.update(|x| x + 4);

      move_to!(request_version, 1)
    }
    otherwise!(5) => fail!(UNEXPECTED_CHARACTER, "Expected protocol"),
    _ => suspend!(),
  }
});

state!(request_version, {
  match data {
    [digit!(), char!('.'), digit!(), char!('\r'), char!('\n'), ..] => {
      // Validate the version
      let version = &data[0..3];

      match version {
        string!("1.1") | string!("2.0") => {
          use_mixin!(store_parsed_http_version);

          // Reject HTTP/2.0
          if parser.method.get() == METHOD_PRI {
            return fail!(UNSUPPORTED_HTTP_VERSION, "HTTP/2.0 is not supported");
          }

          callback!(on_version, 3);
          move_to!(header_name, 5)
        }
        _ => fail!(INVALID_VERSION, "Invalid HTTP version"),
      }
    }
    otherwise!(5) => fail!(UNEXPECTED_CHARACTER, "Expected HTTP version"),
    _ => suspend!(),
  }
});
// #endregion request

// #region response - Status line
// RFC 9112 section 4
state!(response, {
  match data {
    crlf!() => 2, // RFC 9112 section 2.2 - Repeated
    string!("HTTP/") | string!("RTSP/") => {
      callback!(on_protocol, 4);
      move_to!(response_version, 5)
    }
    otherwise!(5) => {
      fail!(UNEXPECTED_CHARACTER, "Expected protocol")
    }
    _ => suspend!(),
  }
});

state!(response_version, {
  match data {
    [digit!(), char!('.'), digit!(), char!(' '), ..] => {
      // Validate the version
      let version = &data[0..3];

      match version {
        string!("1.1") | string!("2.0") => {
          use_mixin!(store_parsed_http_version);
          callback!(on_version, 3);
          move_to!(response_status, 4)
        }
        _ => fail!(INVALID_VERSION, "Invalid HTTP version"),
      }
    }
    otherwise!(4) => fail!(UNEXPECTED_CHARACTER, "Expected HTTP version"),
    _ => suspend!(),
  }
});

state!(response_status, {
  // Collect the three digits
  match data {
    [digit!(), digit!(), digit!(), char!(' '), ..] => {
      // Store the status as integer
      parser
        .status
        .set(unsafe { str::from_utf8_unchecked(&data[0..3]).parse::<u32>().unwrap() });

      callback!(on_status, 3);
      move_to!(response_reason, 4)
    }
    otherwise!(4) => fail!(INVALID_STATUS, "Expected HTTP response status"),
    _ => suspend!(),
  }
});

state!(response_reason, {
  consume!(token_value);

  match data[consumed..] {
    crlf!() => {
      if consumed > 0 {
        callback!(on_reason, consumed);
        parser.position.update(|x| x + (consumed as u64));
      }

      move_to!(header_name, 2)
    }
    otherwise!(2) => fail!(UNEXPECTED_CHARACTER, "Expected status reason"),
    _ => suspend!(),
  }
});
// #endregion response

// #region headers - Headers
// RFC 9112 section 4
state!(header_name, {
  // Special headers treating
  match data {
    case_insensitive_string!("content-length:") => {
      let status = parser.status.get();

      if parser.has_chunked_transfer_encoding.get() {
        return fail!(
          UNEXPECTED_CONTENT_LENGTH,
          "Unexpected Content-Length header when Transfer-Encoding header is present"
        );
      } else if status == 204 || status / 100 == 1 {
        return fail!(
          UNEXPECTED_CONTENT_LENGTH,
          format!("Unexpected Content-Length header for a response with status {}", status)
        );
      } else if parser.content_length.get() != 0 {
        return fail!(INVALID_CONTENT_LENGTH, "Invalid duplicate Content-Length header");
      }

      parser.has_content_length.set(true);
      callback!(on_header_name, string_length!("content-length"));
      return move_to!(header_content_length, string_length!("content-length", 1));
    }
    case_insensitive_string!("transfer-encoding:") => {
      let status = parser.status.get();

      if parser.content_length.get() > 0 {
        return fail!(
          UNEXPECTED_TRANSFER_ENCODING,
          "Unexpected Transfer-Encoding header when Content-Length header is present"
        );
      } else if status == 304 {
        // Transfer-Encoding is NOT allowed in 304
        return fail!(
          UNEXPECTED_TRANSFER_ENCODING,
          format!(
            "Unexpected Transfer-Encoding header for a response with status {}",
            status
          )
        );
      }

      callback!(on_header_name, string_length!("transfer-encoding"));
      return move_to!(header_transfer_encoding, string_length!("transfer-encoding", 1));
    }
    case_insensitive_string!("connection:") => {
      callback!(on_header_name, string_length!("connection"));
      return move_to!(header_connection, string_length!("connection", 1));
    }
    // RFC 9110 section 9.5
    case_insensitive_string!("trailer:") => {
      parser.has_trailers.set(true);
      callback!(on_header_name, string_length!("trailer"));
      return move_to!(header_value, string_length!("trailer", 1));
    }
    // RFC 9110 section 7.8
    case_insensitive_string!("upgrade:") => {
      parser.has_upgrade.set(true);
      callback!(on_header_name, string_length!("upgrade"));
      return move_to!(header_value, string_length!("upgrade", 1));
    }
    _ => {}
  }

  consume!(token);

  match data[consumed..] {
    [char!(':'), ..] if consumed > 0 => {
      callback!(on_header_name, consumed);
      move_to!(header_value, consumed + 1)
    }
    crlf!() => {
      parser.continue_without_data.set(true);
      move_to!(headers, 2)
    }
    otherwise!(2) => fail!(UNEXPECTED_CHARACTER, "Invalid header field name character"),
    _ => suspend!(),
  }
});

// RFC 9112 section 6.1
state!(header_transfer_encoding, {
  // Ignore trailing OWS
  consume!(ws);
  parser.position.update(|x| x + (consumed as u64));
  data = &data[consumed..];

  if let case_insensitive_string!("chunked\r\n")
  | case_insensitive_string!(",chunked\r\n")
  | case_insensitive_string!(", chunked\r\n") = data
  {
    // If this is 1, it means the Transfer-Encoding header was specified more than
    // once. This is the second repetition and therefore, the previous one is no
    // longer the last one, making it invalid.
    if parser.has_chunked_transfer_encoding.get() {
      return fail!(
        INVALID_TRANSFER_ENCODING,
        "The value \"chunked\" in the Transfer-Encoding header must be the last provided and can be provided only once"
      );
    }

    parser.has_chunked_transfer_encoding.set(true);
  } else if parser.has_chunked_transfer_encoding.get() {
    // Any other value when chunked was already specified is invalid as the previous
    // chunked would not be the last one anymore
    return fail!(
      INVALID_TRANSFER_ENCODING,
      "The value \"chunked\" in the Transfer-Encoding header must be the last provided"
    );
  }

  consume!(token_value);

  if consumed == 0 {
    return fail!(INVALID_TRANSFER_ENCODING, "Invalid header field value character");
  }

  match data[consumed..] {
    double_crlf!() => {
      callback!(on_header_value, consumed);
      parser.position.update(|x| x + (consumed as u64));
      parser.continue_without_data.set(true);
      move_to!(headers, 4)
    }
    crlf!() => {
      callback!(on_header_value, consumed);
      move_to!(header_name, consumed + 2)
    }
    otherwise!(2) => fail!(INVALID_TRANSFER_ENCODING, "Invalid header field value character"),
    _ => suspend!(),
  }
});

// RFC 9112 section 6.2
state!(header_content_length, {
  // Ignore trailing OWS
  consume!(ws);
  parser.position.update(|x| x + (consumed as u64));
  data = &data[consumed..];

  consume!(digit);

  if consumed == 0 {
    return fail!(INVALID_CONTENT_LENGTH, "Invalid header field value character");
  }

  match data[consumed..] {
    crlf!() => {
      if let Ok(length) = unsafe { str::from_utf8_unchecked(&data[0..consumed]) }.parse::<u64>() {
        parser.content_length.set(length);
        parser.remaining_content_length.set(parser.content_length.get());

        callback!(on_header_value, consumed);
        move_to!(header_name, consumed + 2)
      } else {
        fail!(INVALID_CONTENT_LENGTH, "Invalid Content-Length header")
      }
    }
    otherwise!(2) => fail!(INVALID_CONTENT_LENGTH, "Invalid header field value character"),
    _ => suspend!(),
  }
});

// RFC 9112 section 9.6
state!(header_connection, {
  // Ignore trailing OWS
  consume!(ws);
  parser.position.update(|x| x + (consumed as u64));
  data = &data[consumed..];

  match data {
    case_insensitive_string!("close\r\n") => {
      parser.connection.set(CONNECTION_CLOSE);
      callback!(on_header_value, string_length!("close"));
      return move_to!(header_name, string_length!("close", 2));
    }
    case_insensitive_string!("keep-alive\r\n") => {
      parser.connection.set(CONNECTION_KEEPALIVE);
      callback!(on_header_value, string_length!("keep-alive"));
      return move_to!(header_name, string_length!("keep-alive", 2));
    }
    case_insensitive_string!("upgrade\r\n") => {
      parser.connection.set(CONNECTION_UPGRADE);
      callback!(on_header_value, string_length!("upgrade"));
      return move_to!(header_name, string_length!("upgrade", 2));
    }
    _ => {}
  }

  consume!(token_value);

  if consumed == 0 {
    return fail!(UNEXPECTED_CHARACTER, "Invalid header field value character");
  }

  match data[consumed..] {
    double_crlf!() => {
      callback!(on_header_value, consumed);
      parser.position.update(|x| x + (consumed as u64));
      parser.continue_without_data.set(true);
      move_to!(headers, 4)
    }
    crlf!() => {
      callback!(on_header_value, consumed);
      move_to!(header_name, consumed + 2)
    }
    otherwise!(2) => fail!(UNEXPECTED_CHARACTER, "Invalid header field value character"),
    _ => suspend!(),
  }
});

// RFC 9110 section 5.5 and 5.6
state!(header_value, {
  // Ignore trailing OWS
  consume!(ws);

  parser.position.update(|x| x + (consumed as u64));
  data = &data[consumed..];

  consume!(token_value);

  if consumed == 0 {
    return fail!(UNEXPECTED_CHARACTER, "Invalid header field value character");
  }

  // Strip trailing OWS
  let mut trimmed_consumed = consumed;
  while let char!('\t') | char!(' ') = data[trimmed_consumed - 1] {
    trimmed_consumed -= 1;
  }

  match data[consumed..] {
    double_crlf!() => {
      callback!(on_header_value, trimmed_consumed);
      parser.position.update(|x| x + (consumed as u64));
      parser.continue_without_data.set(true);
      move_to!(headers, 4)
    }
    crlf!() => {
      callback!(on_header_value, trimmed_consumed);
      move_to!(header_name, consumed + 2)
    }
    otherwise!(2) => fail!(UNEXPECTED_CHARACTER, "Invalid header field value character"),
    _ => suspend!(),
  }
});

// RFC 9110 section 9.3.6 and 7.8 - Headers have finished, check if the
// connection must be upgraded or a body is expected.
state!(headers, {
  parser.continue_without_data.set(true);

  if parser.has_upgrade.get() && parser.connection.get() != CONNECTION_UPGRADE {
    parser.continue_without_data.set(false);

    return fail!(
      MISSING_CONNECTION_UPGRADE,
      format!("Missing Connection header set to \"upgrade\" when using the Upgrade header")
    );
  }

  callback!(on_headers);

  let method = parser.method.get();
  let status = parser.status.get();

  // In case of Connection: Upgrade
  if parser.has_upgrade.get() {
    if parser.connection.get() != CONNECTION_UPGRADE {
      parser.continue_without_data.set(false);

      return fail!(
        MISSING_CONNECTION_UPGRADE,
        format!("Missing Connection header set to \"upgrade\" when using the Upgrade header")
      );
    }

    callback!(on_upgrade);
    return move_to!(tunnel, 0);
  }

  // In case of CONNECT method
  if parser.is_connect.get() {
    callback!(on_connect);
    return move_to!(tunnel, 0);
  }

  if (method == METHOD_GET || method == METHOD_HEAD) && parser.content_length.get() > 0 {
    parser.continue_without_data.set(false);

    return fail!(UNEXPECTED_CONTENT, format!("Unexpected content for {} request", method));
  }

  // RFC 9110 section 6.3
  if parser.message_type.get() == REQUEST {
    if parser.has_content_length.get() {
      if parser.content_length.get() == 0 {
        return complete_message(parser, 0);
      }
    } else if !parser.has_chunked_transfer_encoding.get() {
      return complete_message(parser, 0);
    }
  } else {
    if (status < 200 && status != 101) || method == METHOD_HEAD || parser.skip_body.get() {
      return complete_message(parser, 0);
    }

    if parser.content_length.get() == 0 {
      if parser.has_content_length.get() {
        return complete_message(parser, 0);
      } else if !parser.has_chunked_transfer_encoding.get() {
        return move_to!(body_with_no_length, 0);
      }
    }
  }

  move_to!(body, 0)
});

// #endregion headers

// RFC 9110 section 6.4.1 - Message completed
#[inline(always)]
fn complete_message(parser: &Parser, advance: isize) -> isize {
  callback!(on_message_complete);

  let connection = parser.connection.get();

  parser.clear();
  parser.connection.set(connection);

  callback!(on_reset);

  let must_close = parser.connection.get() == CONNECTION_CLOSE;
  parser.connection.set(0);

  if must_close {
    move_to!(finish, advance)
  } else {
    move_to!(start, advance)
  }
}

// #region common_body - Check if the body uses chunked encoding
state!(body, {
  if parser.content_length.get() > 0 {
    return move_to!(body_via_content_length, 0);
  }

  if parser.has_trailers.get() && !parser.has_chunked_transfer_encoding.get() {
    return fail!(
      UNTRAILERS,
      "Trailers are not allowed when not using chunked transfer encoding"
    );
  }

  move_to!(chunk_length, 0)
});

// Return PAUSE makes this method idempotent without failing - In this state
// all data is ignored since the connection is not in HTTP anymore
state!(tunnel, { suspend!() });

// #endregion common_body

// #region body via Content-Length
// RFC 9112 section 6.2
state!(body_via_content_length, {
  let expected = parser.remaining_content_length.get();
  let available = data.len() as u64;

  // Less data than what it is expected
  if available < expected {
    parser.remaining_content_length.update(|x| x - available);
    callback!(on_data, available as usize);

    return available as isize;
  }

  callback!(on_data, expected as usize);
  parser.remaining_content_length.set(0);
  callback!(on_body);
  complete_message(parser, expected as isize)
});
// #endregion body via Content-Length

// RFC 9110 section 6.3 - Body with no length nor chunked encoding. This is only
// allowed in responses.
//
// Note that on_body can't and will not be called here as there is no way to
// know when the response finishes.
state!(body_with_no_length, {
  let len = data.len();
  callback!(on_data, len);
  len as isize
});

// #region body via chunked Transfer-Encoding
// RFC 9112 section 7.1
state!(chunk_length, {
  consume!(hex_digit);

  match data[consumed..] {
    [char!(';'), ..] if consumed > 0 => {
      // Parse the length as integer
      if let Ok(length) = u64::from_str_radix(unsafe { str::from_utf8_unchecked(&data[..consumed]) }, 16) {
        callback!(on_chunk_length, consumed);
        parser.chunk_size.set(length);
        parser.remaining_chunk_size.set(parser.chunk_size.get());
        move_to!(chunk_extension_name, consumed + 1)
      } else {
        fail!(INVALID_CHUNK_SIZE, "Invalid chunk length")
      }
    }
    crlf!() => {
      if let Ok(length) = u64::from_str_radix(unsafe { str::from_utf8_unchecked(&data[..consumed]) }, 16) {
        // Parse the length as integer
        callback!(on_chunk_length, consumed);
        parser.chunk_size.set(length);
        parser.remaining_chunk_size.set(parser.chunk_size.get());
        parser.continue_without_data.set(true);
        move_to!(chunk_data, consumed + 2)
      } else {
        fail!(INVALID_CHUNK_SIZE, "Invalid chunk length")
      }
    }
    otherwise!(2) => fail!(UNEXPECTED_CHARACTER, "Invalid chunk length character"),
    _ => suspend!(),
  }
});

state!(chunk_extension_name, {
  consume!(token);

  if consumed == 0 {
    return fail!(UNEXPECTED_CHARACTER, "Invalid chunk extension name character");
  }

  match data[consumed..] {
    [char!('='), ..] => {
      callback!(on_chunk_extension_name, consumed);
      move_to!(chunk_extension_value, consumed + 1)
    }
    [char!(';'), ..] => {
      callback!(on_chunk_extension_name, consumed);
      move_to!(chunk_extension_name, consumed + 1)
    }
    crlf!() => {
      callback!(on_chunk_extension_name, consumed);

      parser.continue_without_data.set(true);
      move_to!(chunk_data, consumed + 2)
    }
    otherwise!(2) => fail!(UNEXPECTED_CHARACTER, "Invalid chunk extension name character"),
    _ => suspend!(),
  }
});

state!(chunk_extension_value, {
  if data[0] == char!('"') {
    return move_to!(chunk_extension_quoted_value, 1);
  }

  consume!(token);

  if consumed == 0 {
    return fail!(UNEXPECTED_CHARACTER, "Invalid chunk extension value character");
  }

  match data[consumed..] {
    [char!(';'), ..] => {
      callback!(on_chunk_extension_value, consumed);
      move_to!(chunk_extension_name, consumed + 1)
    }
    crlf!() => {
      callback!(on_chunk_extension_value, consumed);
      parser.continue_without_data.set(true);
      move_to!(chunk_data, consumed + 2)
    }
    otherwise!(2) => fail!(UNEXPECTED_CHARACTER, "Invalid chunk extension value character"),
    _ => suspend!(),
  }
});

// RFC 9110 section 5.6.4
state!(chunk_extension_quoted_value, {
  // Also consume 0x22 and 0x5c as the quoted-pair validation is performed after
  consume!(token_value_quoted);

  if consumed == 0 || data[consumed - 1] != char!('"') {
    return fail!(UNEXPECTED_CHARACTER, "Invalid chunk extension quoted value");
  }

  // Search if multiple parameters are specified on the same line. Stop on the
  // first non quoted "
  for i in 0..consumed - 2 {
    if data[i + 1] == char!('"') && data[i] != char!('\\') {
      consumed = i + 2;
      break;
    }
  }

  // If the last " is quoted, then fail
  if data[consumed - 2] == char!('\\') && data[consumed - 1] == char!('"') {
    return fail!(UNEXPECTED_CHARACTER, "Invalid chunk extension quoted value");
  }

  match data[consumed..] {
    crlf!() => {
      parser.continue_without_data.set(true);
      callback!(on_chunk_extension_value, consumed - 1);
      move_to!(chunk_data, consumed + 2)
    }
    [char!(';'), ..] => {
      parser.continue_without_data.set(true);
      callback!(on_chunk_extension_value, consumed - 1);
      move_to!(chunk_extension_name, consumed + 2)
    }
    otherwise!(3) => {
      fail!(UNEXPECTED_CHARACTER, "Invalid chunk extension quoted value character")
    }
    _ => suspend!(),
  }
});

state!(chunk_data, {
  // When receiving the last chunk
  if parser.chunk_size.get() == 0 {
    callback!(on_body);

    if parser.has_trailers.get() {
      return move_to!(trailer_name, 0);
    } else {
      return move_to!(crlf_after_last_chunk, 0);
    }
  }

  let expected = parser.remaining_chunk_size.get();
  let available = data.len() as u64;

  // Less data than what it is expected for this chunk
  if available < expected {
    parser.remaining_chunk_size.update(|x| x - available);
    callback!(on_data, available as usize);

    return available as isize;
  }

  callback!(on_data, expected as usize);
  parser.remaining_chunk_size.set(0);
  callback!(on_body);
  move_to!(chunk_end, expected)
});

state!(chunk_end, {
  match data {
    crlf!() => {
      parser.chunk_size.set(0);
      parser.remaining_chunk_size.set(0);
      move_to!(chunk_length, 2)
    }
    otherwise!(2) => fail!(UNEXPECTED_CHARACTER, "Unexpected character after chunk data"),
    _ => suspend!(),
  }
});

state!(crlf_after_last_chunk, {
  match data {
    crlf!() => complete_message(parser, 2),
    otherwise!(2) => fail!(UNEXPECTED_CHARACTER, "Expected CRLF after the last chunk"),
    _ => suspend!(),
  }
});

// #endregion body via chunked Transfer-Encoding

// #region trailers - Trailers
// RFC 9112 section 7.1.2
state!(trailer_name, {
  consume!(token);

  match data[consumed..] {
    [char!(':'), ..] if consumed > 0 => {
      callback!(on_trailer_name, consumed);
      move_to!(trailer_value, consumed + 1)
    }
    crlf!() => {
      callback!(on_trailers);
      complete_message(parser, 2)
    }
    otherwise!(2) => fail!(UNEXPECTED_CHARACTER, "Invalid trailer field name character"),
    _ => suspend!(),
  }
});

state!(trailer_value, {
  // Ignore trailing OWS
  consume!(ws);
  parser.position.update(|x| x + (consumed as u64));
  data = &data[consumed..];

  consume!(token_value);

  if consumed == 0 {
    return fail!(UNEXPECTED_CHARACTER, "Invalid trailer field value character");
  }

  match data[consumed..] {
    double_crlf!() => {
      callback!(on_trailer_value, consumed);
      callback!(on_trailers);
      complete_message(parser, (consumed + 4) as isize)
    }
    crlf!() => {
      callback!(on_trailer_value, consumed);
      move_to!(trailer_name, consumed + 2)
    }
    otherwise!(2) => fail!(UNEXPECTED_CHARACTER, "Invalid trailer field value character"),
    _ => suspend!(),
  }
});

// #endregion trailers

generate_constants!();

#[cfg(not(target_family = "wasm"))]
generate_callbacks!();

#[cfg(target_family = "wasm")]
generate_callbacks_wasm!();

#[wasm_bindgen]
#[repr(C)]
#[derive(Clone, Debug)]
pub struct Parser {
  #[wasm_bindgen(skip)]
  pub owner: Cell<*mut c_void>,

  #[wasm_bindgen(skip)]
  pub state: Cell<u8>,

  #[wasm_bindgen(skip)]
  pub position: Cell<u64>,

  #[wasm_bindgen(skip)]
  pub paused: Cell<bool>,

  #[wasm_bindgen(skip)]
  pub error_code: Cell<u8>,

  #[wasm_bindgen(skip)]
  pub error_description: Cell<*const c_uchar>,

  #[wasm_bindgen(skip)]
  pub error_description_len: Cell<usize>,

  #[wasm_bindgen(skip)]
  pub unconsumed: Cell<*const c_uchar>,

  #[wasm_bindgen(skip)]
  pub unconsumed_len: Cell<usize>,

  #[wasm_bindgen(skip)]
  pub id: Cell<u8>,

  #[wasm_bindgen(skip)]
  pub mode: Cell<u8>,

  #[wasm_bindgen(skip)]
  pub continue_without_data: Cell<bool>,

  #[wasm_bindgen(skip)]
  pub message_type: Cell<u8>,

  #[wasm_bindgen(skip)]
  pub is_connect: Cell<bool>,

  #[wasm_bindgen(skip)]
  pub method: Cell<u8>,

  #[wasm_bindgen(skip)]
  pub status: Cell<u32>,

  #[wasm_bindgen(skip)]
  pub version_major: Cell<u8>,

  #[wasm_bindgen(skip)]
  pub version_minor: Cell<u8>,

  #[wasm_bindgen(skip)]
  pub connection: Cell<u8>,

  #[wasm_bindgen(skip)]
  pub has_content_length: Cell<bool>,

  #[wasm_bindgen(skip)]
  pub has_chunked_transfer_encoding: Cell<bool>,

  #[wasm_bindgen(skip)]
  pub has_upgrade: Cell<bool>,

  #[wasm_bindgen(skip)]
  pub has_trailers: Cell<bool>,

  #[wasm_bindgen(skip)]
  pub content_length: Cell<u64>,

  #[wasm_bindgen(skip)]
  pub chunk_size: Cell<u64>,

  #[wasm_bindgen(skip)]
  pub remaining_content_length: Cell<u64>,

  #[wasm_bindgen(skip)]
  pub remaining_chunk_size: Cell<u64>,

  #[wasm_bindgen(skip)]
  pub skip_body: Cell<bool>,

  #[wasm_bindgen(skip)]
  pub callbacks: Callbacks,
}

#[wasm_bindgen]
impl Parser {
  pub fn new() -> Parser {
    initialize_states_table!();

    Parser {
      owner: Cell::new(ptr::null_mut()),
      state: Cell::new(0),
      position: Cell::new(0),
      paused: Cell::new(false),
      error_code: Cell::new(ERROR_NONE),
      error_description: Cell::new(ptr::null()),
      error_description_len: Cell::new(0),
      unconsumed: Cell::new(ptr::null()),
      unconsumed_len: Cell::new(0),
      id: Cell::new(0),
      mode: Cell::new(0),
      continue_without_data: Cell::new(false),
      message_type: Cell::new(0),
      is_connect: Cell::new(false),
      method: Cell::new(0),
      status: Cell::new(0),
      version_major: Cell::new(0),
      version_minor: Cell::new(0),
      connection: Cell::new(0),
      has_content_length: Cell::new(false),
      has_chunked_transfer_encoding: Cell::new(false),
      has_upgrade: Cell::new(false),
      has_trailers: Cell::new(false),
      content_length: Cell::new(0),
      chunk_size: Cell::new(0),
      remaining_content_length: Cell::new(0),
      remaining_chunk_size: Cell::new(0),
      skip_body: Cell::new(false),
      callbacks: Callbacks::new(),
    }
  }

  /// Resets a parser. The second parameters specifies if to also reset the
  /// position counter.
  #[wasm_bindgen]
  pub fn reset(&self, keep_position: bool) {
    self.state.set(0);
    self.paused.set(false);

    if !keep_position {
      self.position.set(0);
    }

    self.error_code.set(ERROR_NONE);

    if self.error_description_len.get() > 0 {
      unsafe {
        let len = self.error_description_len.get();
        Vec::from_raw_parts(self.error_description.get() as *mut c_uchar, len, len);
      }

      self.error_description.set(ptr::null());
      self.error_description_len.set(0);
    }

    if self.unconsumed_len.get() > 0 {
      unsafe {
        let len = self.unconsumed_len.get();
        Vec::from_raw_parts(self.unconsumed.get() as *mut c_uchar, len, len);
      }

      self.unconsumed.set(ptr::null());
      self.unconsumed_len.set(0);
    }

    self.clear();

    callback_no_return!(on_reset);
  }

  /// Clears all values in the parser.
  ///
  /// Persisted fields, unconsumed data and the position are not cleared.
  #[wasm_bindgen]
  pub fn clear(&self) {
    self.message_type.set(0);
    self.is_connect.set(false);
    self.method.set(0);
    self.status.set(0);
    self.version_major.set(0);
    self.version_minor.set(0);
    self.connection.set(0);
    self.has_content_length.set(false);
    self.has_chunked_transfer_encoding.set(false);
    self.has_upgrade.set(false);
    self.has_trailers.set(false);
    self.content_length.set(0);
    self.chunk_size.set(0);
    self.remaining_content_length.set(0);
    self.remaining_chunk_size.set(0);
    self.skip_body.set(false);
  }

  /// # Safety
  ///
  /// Parses a slice of characters. It returns the number of consumed
  /// characters.

  /// Moves the parsers to a new state and marks a certain number of characters
  /// as used.
  ///
  /// The allow annotation is needed when building in release mode.
  #[allow(dead_code)]
  fn move_to(&self, state: u8, advance: isize) -> isize {
    let parser = self;

    #[cfg(debug_assertions)]
    // Notify the end of the current state
    #[cfg(debug_assertions)]
    callback!(before_state_change);

    // Change the state
    parser.state.set(state);

    // Notify the start of the current state
    #[cfg(debug_assertions)]
    callback!(after_state_change);

    advance
  }

  /// Marks the parsing a failed, setting a error code and and error message.
  fn fail(&self, code: u8, reason: String) -> isize {
    // Set the code
    self.error_code.set(code);

    // Set the message
    let (ptr, len, _) = Vec::into_raw_parts(reason.as_bytes().into());

    self.error_description.set(ptr);
    self.error_description_len.set(len);
    self.state.set(STATE_ERROR);

    // Do not process any additional data
    0
  }

  /// Marks the parsing a failed, setting a error code and and error message.
  fn fail_str(&self, code: u8, reason: &str) -> isize { self.fail(code, reason.into()) }

  /// Pauses the parser. It will have to be resumed via `milo_resume`.
  #[wasm_bindgen]
  pub fn pause(&self) { self.paused.set(true); }

  /// Resumes the parser.
  #[wasm_bindgen]
  pub fn resume(&self) { self.paused.set(false); }

  /// Marks the parser as finished. Any new data received via `parse` will
  /// put the parser in the error state.
  #[wasm_bindgen]
  pub fn finish(&self) {
    match self.state.get() {
      // If the parser is one of the initial states, simply jump to finish
      STATE_START | STATE_REQUEST | STATE_RESPONSE | STATE_FINISH => {
        self.state.set(STATE_FINISH);
      }
      STATE_BODY_WITH_NO_LENGTH => {
        // Notify that the message has been completed
        callback_no_return!(on_message_complete);

        // Set the state to be finished
        self.state.set(STATE_FINISH);
      }
      STATE_ERROR => (),
      // In another other state, this is an error
      _ => {
        self.fail_str(ERROR_UNEXPECTED_EOF, "Unexpected end of data");
      }
    }
  }

  /// Returns the current parser's state as string.
  #[wasm_bindgen(getter, js_name = "stateString")]
  pub fn state_string(&self) -> String { c_match_state_string!() }

  /// Returns the current parser's error state as string.
  #[wasm_bindgen(getter, js_name = "errorCodeString")]
  pub fn error_code_string(&self) -> String { c_match_error_code_string!() }

  /// Returns the current parser's error descrition.
  #[wasm_bindgen(getter, js_name = "errorDescription")]
  pub fn error_description_string(&self) -> String {
    unsafe {
      String::from_utf8_unchecked(
        from_raw_parts(self.error_description.get(), self.error_description_len.get()).to_vec(),
      )
    }
  }
}

// This impl only contains the parse method which cannot be exported to WASM
impl Parser {
  /// # Safety
  ///
  /// Parses a slice of characters. It returns the number of consumed
  /// characters.
  pub fn parse(&self, data: *const c_uchar, limit: usize) -> usize {
    // If the parser is paused, this is a no-op
    if self.paused.get() {
      return 0;
    }

    let mut limit = limit;
    let aggregate: Vec<c_uchar>;
    let mut consumed = 0;
    let data = unsafe { from_raw_parts(data, limit) };

    parse!();

    // Return the number of consumed bytes
    consumed
  }
}
// This impl only contains the parse_wasm method which is exported to WASM
#[cfg(target_family = "wasm")]
#[wasm_bindgen]
impl Parser {
  /// Creates a new parser.
  #[wasm_bindgen(constructor)]
  pub fn new_with_id(id: Option<u8>) -> Parser {
    let parser = Parser::new();
    parser.id.set(id.unwrap_or(0));
    parser
  }

  #[wasm_bindgen(js_name = "parse")]
  pub fn parse_wasm(&self, data: &[u8], limit: usize) -> Result<usize, JsValue> {
    #[cfg(debug_assertions)]
    std::panic::set_hook(Box::new(console_error_panic_hook::hook));

    // If the parser is paused, this is a no-op
    if self.paused.get() {
      return Ok(0);
    }

    let mut limit = limit;
    let aggregate: Vec<c_uchar>;
    let mut consumed = 0;

    parse!();

    if let ERROR_CALLBACK_ERROR = self.error_code.get() {
      return Err(js_sys::Error::new(&self.error_description_string()).into());
    }

    Ok(consumed)
  }

  #[wasm_bindgen(getter, js_name = "state")]
  pub fn get_state(&self) -> u8 { self.state.get() }

  #[wasm_bindgen(getter, js_name = "position")]
  pub fn get_position(&self) -> u64 { self.position.get() }

  #[wasm_bindgen(getter, js_name = "paused")]
  pub fn get_paused(&self) -> bool { self.paused.get() }

  #[wasm_bindgen(getter, js_name = "errorCode")]
  pub fn get_error_code(&self) -> u8 { self.error_code.get() }

  #[wasm_bindgen(getter = id)]
  pub fn get_id(&self) -> u8 { self.id.get() }

  #[wasm_bindgen(setter = id)]
  pub fn set_id(&self, value: u8) { self.id.set(value); }

  #[wasm_bindgen(getter = mode)]
  pub fn get_mode(&self) -> u8 { self.mode.get() }

  #[wasm_bindgen(setter = mode)]
  pub fn set_mode(&self, value: u8) { self.mode.set(value); }

  #[wasm_bindgen(getter, js_name = "continueWithoutData")]
  pub fn get_continue_without_data(&self) -> bool { self.continue_without_data.get() }

  #[wasm_bindgen(getter, js_name = "messageType")]
  pub fn get_message_type(&self) -> u8 { self.message_type.get() }

  #[wasm_bindgen(getter = isConnect)]
  pub fn get_is_connect(&self) -> bool { self.is_connect.get() }

  #[wasm_bindgen(setter = isConnect)]
  pub fn set_is_connect(&self, value: bool) { self.is_connect.set(value); }

  #[wasm_bindgen(getter, js_name = "method")]
  pub fn get_method(&self) -> u8 { self.method.get() }

  #[wasm_bindgen(getter, js_name = "status")]
  pub fn get_status(&self) -> u32 { self.status.get() }

  #[wasm_bindgen(getter, js_name = "versionMajor")]
  pub fn get_version_major(&self) -> u8 { self.version_major.get() }

  #[wasm_bindgen(getter, js_name = "versionMinor")]
  pub fn get_version_minor(&self) -> u8 { self.version_minor.get() }

  #[wasm_bindgen(getter, js_name = "connection")]
  pub fn get_connection(&self) -> u8 { self.connection.get() }

  #[wasm_bindgen(getter, js_name = "hasContentLength")]
  pub fn get_has_content_length(&self) -> bool { self.has_content_length.get() }

  #[wasm_bindgen(getter, js_name = "hasChunkedTransferEncoding")]
  pub fn get_has_chunked_transfer_encoding(&self) -> bool { self.has_chunked_transfer_encoding.get() }

  #[wasm_bindgen(getter, js_name = "hasUpgrade")]
  pub fn get_has_upgrade(&self) -> bool { self.has_upgrade.get() }

  #[wasm_bindgen(getter, js_name = "hasTrailers")]
  pub fn get_has_trailers(&self) -> bool { self.has_trailers.get() }

  #[wasm_bindgen(getter, js_name = "contentLength")]
  pub fn get_content_length(&self) -> u64 { self.content_length.get() }

  #[wasm_bindgen(getter, js_name = "chunkSize")]
  pub fn get_chunk_size(&self) -> u64 { self.chunk_size.get() }

  #[wasm_bindgen(getter, js_name = "remainingContentLength")]
  pub fn get_remaining_content_length(&self) -> u64 { self.remaining_content_length.get() }

  #[wasm_bindgen(getter, js_name = "remainingChunkSize")]
  pub fn get_remaining_chunk_size(&self) -> u64 { self.remaining_chunk_size.get() }

  #[wasm_bindgen(getter, js_name = "unconsumed")]
  pub fn get_unconsumed_len(&self) -> usize { self.unconsumed_len.get() }

  #[wasm_bindgen(getter = skipBody)]
  pub fn get_skip_body(&self) -> bool { self.skip_body.get() }

  #[wasm_bindgen(setter = skipBody)]
  pub fn set_skip_body(&self, value: bool) { self.skip_body.set(value); }
}

#[cfg(target_family = "wasm")]
generate_callbacks_wasm_setters!();

/// A callback that simply returns `0`.
///
/// Use this callback as pointer when you want to remove a callback from the
/// parser.
#[no_mangle]
pub extern "C" fn milo_noop(_parser: &Parser, _data: *const c_uchar, _len: usize) -> isize { 0 }

/// Cleans up memory used by a string previously returned by one of the milo's C
/// public interface.
#[no_mangle]
pub extern "C" fn milo_free_string(s: *const c_uchar) {
  unsafe {
    if s.is_null() {
      return;
    }

    let _ = CString::from_raw(s as *mut c_char);
  }
}

/// Creates a new parser.
#[no_mangle]
pub extern "C" fn milo_create() -> *mut Parser { Box::into_raw(Box::new(Parser::new())) }

/// # Safety
///
/// Destroys a parser.
#[no_mangle]
pub extern "C" fn milo_destroy(ptr: *mut Parser) {
  if ptr.is_null() {
    return;
  }

  unsafe {
    let _ = Box::from_raw(ptr);
  }
}

/// # Safety
///
/// Resets a parser to its initial state.
#[no_mangle]
pub extern "C" fn milo_reset(parser: *const Parser, keep_position: bool) { unsafe { (*parser).reset(keep_position) } }

/// # Safety
///
/// Parses a slice of characters. It returns the number of consumed characters.
#[no_mangle]
pub extern "C" fn milo_parse(parser: *const Parser, data: *const c_uchar, limit: usize) -> usize {
  unsafe { (*parser).parse(data, limit) }
}

/// # Safety
///
/// Pauses the parser. It will have to be resumed via `milo_resume`.
#[no_mangle]
pub extern "C" fn milo_pause(parser: *const Parser) { unsafe { (*parser).pause() } }

/// # Safety
///
/// Resumes the parser.
#[no_mangle]
pub extern "C" fn milo_resume(parser: *const Parser) { unsafe { (*parser).resume() } }

/// # Safety
///
/// Marks the parser as finished. Any new data received via `milo_parse` will
/// put the parser in the error state.
#[no_mangle]
pub extern "C" fn milo_finish(parser: *const Parser) { unsafe { (*parser).finish() } }

/// # Safety
///
/// Returns the current parser's state as string.
///
/// The returned value must be freed using `free_string`.
#[no_mangle]
pub extern "C" fn milo_state_string(parser: *const Parser) -> *const c_uchar {
  unsafe {
    let value = (*parser).state_string();
    CString::new(value).unwrap().into_raw() as *const c_uchar
  }
}

/// # Safety
///
/// Returns the current parser's error state as string.
///
/// The returned value must be freed using `free_string`.
#[no_mangle]
pub extern "C" fn milo_error_code_string(parser: *const Parser) -> *const c_uchar {
  unsafe {
    let value = (*parser).error_code_string();
    CString::new(value).unwrap().into_raw() as *const c_uchar
  }
}

/// # Safety
///
/// Returns the current parser's error descrition.
///
/// The returned value must be freed using `free_string`.
#[no_mangle]
pub extern "C" fn milo_error_description_string(parser: *const Parser) -> *const c_uchar {
  unsafe {
    let value = (*parser).error_description_string();
    CString::new(value).unwrap().into_raw() as *const c_uchar
  }
}

#[wasm_bindgen]
extern "C" {
  // Use `js_namespace` here to bind `console.log(..)` instead of just
  // `log(..)`
  #[wasm_bindgen(js_namespace = console)]
  fn log(s: &str);
}
