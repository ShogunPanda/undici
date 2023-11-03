use std::os::raw::c_uchar;
use std::slice;
use std::str;

#[path = "./context.rs"]
mod context;
mod output;

use crate::{Parser, DEBUG, NO_COPY, RESPONSE};

pub fn before_state_change(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  output::append_output(
    parser,
    format!(
      "\"pos\": {}, \"event\": \"before_state_change\", \"current_state\": \"{}\"",
      parser.position.get(),
      parser.state_string()
    ),
    data,
    size,
  )
}

pub fn after_state_change(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  output::append_output(
    parser,
    format!(
      "\"pos\": {}, \"event\": \"after_state_change\", \"current_state\": \"{}\"",
      parser.position.get(),
      parser.state_string()
    ),
    data,
    size,
  )
}

pub fn on_message_start(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  output::append_output(
    parser,
    format!(
      "\"pos\": {}, \"event\": \"begin\", \"configuration\": {{ \"debug\": {}, \"no-copy\": {} }}",
      parser.position.get(),
      DEBUG,
      NO_COPY
    ),
    data,
    size,
  )
}

pub fn on_message_complete(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  output::event(parser, "complete", data, size)
}

pub fn on_error(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  unsafe {
    output::append_output(
      parser,
      format!(
        "\"pos\": {}, \"event\": {}, \"error_code={}, \"error_code_string\": \"{}\", reason=\"{}\"",
        parser.position.get(),
        "error",
        parser.error_code.get() as usize,
        parser.error_code_string(),
        str::from_utf8_unchecked(slice::from_raw_parts(data, size))
      ),
      data,
      size,
    )
  }
}

pub fn on_finish(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  output::event(parser, "finish", data, size)
}

pub fn on_request(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  output::event(parser, "request", data, size)
}

pub fn on_response(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  output::event(parser, "response", data, size)
}

pub fn on_method(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  output::show_span(parser, "method", data, size)
}

pub fn on_url(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  output::show_span(parser, "url", data, size)
}

pub fn on_protocol(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  output::show_span(parser, "protocol", data, size)
}

pub fn on_version(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  output::show_span(parser, "version", data, size)
}

pub fn on_status(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  output::show_span(parser, "status", data, size)
}

pub fn on_reason(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  output::show_span(parser, "reason", data, size)
}

pub fn on_header_name(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  output::show_span(parser, "header_name", data, size)
}

pub fn on_header_value(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  output::show_span(parser, "header_value", data, size)
}

pub fn on_headers(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  let context = unsafe { Box::from_raw(parser.owner.get() as *mut context::Context) };

  let position = parser.position.get();
  let chunked = parser.has_chunked_transfer_encoding.get();
  let content_length = parser.content_length.get();
  let method = context.method.clone();
  let url = context.url.clone();
  let protocol = context.protocol.clone();
  let version = context.version.clone();

  Box::into_raw(context);

  if parser.message_type.get() == RESPONSE {
    let heading = format!(
      "\"pos\": {}, \"event\": {}, \"type\": \"response\", ",
      position,
      output::format_event("headers")
    );

    if chunked {
      output::append_output(
        parser,
        format!(
          "{}\"status\": {}, \"protocol\": \"{}\", \"version\": \"{}\", \"body\": \"chunked\"",
          heading,
          parser.status.get(),
          protocol,
          version,
        ),
        data,
        size,
      )
    } else if content_length > 0 {
      output::append_output(
        parser,
        format!(
          "{}\"status\": {}, \"protocol\": \"{}\", \"version\": \"{}\", \"body\": {}\"",
          heading,
          parser.status.get(),
          protocol,
          version,
          content_length
        ),
        data,
        size,
      )
    } else {
      output::append_output(
        parser,
        format!(
          "{}\"status\": {}, \"protocol\": \"{}\", \"version\": \"{}\", \"body\": null",
          heading,
          parser.status.get(),
          protocol,
          version,
        ),
        data,
        size,
      )
    }
  } else {
    let heading = format!(
      "\"pos\": {}, \"event\": {}, \"type\": \"request\", ",
      position,
      output::format_event("headers")
    );

    if chunked {
      output::append_output(
        parser,
        format!(
          "{}\"method\": \"{}\", \"url\": \"{}\", \"protocol\": \"{}\", \"version\": \"{}\", \"body\": \"chunked\"",
          heading, method, url, protocol, version,
        ),
        data,
        size,
      )
    } else if content_length > 0 {
      output::append_output(
        parser,
        format!(
          "{}\"method\": \"{}\", \"url\": \"{}\", \"protocol\": \"{}\", \"version\": \"{}\", \"body\": {}",
          heading, method, url, protocol, version, content_length
        ),
        data,
        size,
      )
    } else {
      output::append_output(
        parser,
        format!(
          "{}\"method\": \"{}\", \"url\": \"{}\", \"protocol\": \"{}\", \"version\": \"{}\", \"body\": null",
          heading, method, url, protocol, version,
        ),
        data,
        size,
      )
    }
  }
}

pub fn on_upgrade(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  output::event(parser, "upgrade", data, size)
}

pub fn on_chunk_length(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  output::show_span(parser, "chunk_length", data, size)
}

pub fn on_chunk_extension_name(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  output::show_span(parser, "chunk_extensions_name", data, size)
}

pub fn on_chunk_extension_value(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  output::show_span(parser, "chunk_extension_value", data, size)
}

pub fn on_body(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  output::event(parser, "body", data, size)
}

pub fn on_data(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  output::show_span(parser, "data", data, size)
}

pub fn on_trailer_name(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  output::show_span(parser, "trailer_name", data, size)
}

pub fn on_trailer_value(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  output::show_span(parser, "trailer_value", data, size)
}

pub fn on_trailers(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  output::event(parser, "trailers", data, size)
}
