use std::os::raw::c_void;

use regex::Regex;

use crate::Parser;

pub mod context;
mod output;

#[cfg(not(feature = "no-copy"))]
#[path = "./test_utils/callbacks_default.rs"]
pub mod test_callbacks;

#[cfg(feature = "no-copy")]
#[path = "./test_utils/callbacks_no_copy.rs"]
pub mod test_callbacks;

pub fn create_parser() -> Parser {
  let parser = Parser::new();
  let context = Box::new(context::Context::new());
  parser.owner.set(Box::into_raw(context) as *mut c_void);

  parser.callbacks.on_error.set(test_callbacks::on_error);
  parser.callbacks.on_finish.set(test_callbacks::on_finish);
  parser.callbacks.on_request.set(test_callbacks::on_request);
  parser.callbacks.on_response.set(test_callbacks::on_response);
  parser.callbacks.on_message_start.set(test_callbacks::on_message_start);
  parser
    .callbacks
    .on_message_complete
    .set(test_callbacks::on_message_complete);
  parser.callbacks.on_method.set(test_callbacks::on_method);
  parser.callbacks.on_url.set(test_callbacks::on_url);
  parser.callbacks.on_protocol.set(test_callbacks::on_protocol);
  parser.callbacks.on_version.set(test_callbacks::on_version);
  parser.callbacks.on_status.set(test_callbacks::on_status);
  parser.callbacks.on_reason.set(test_callbacks::on_reason);
  parser.callbacks.on_header_name.set(test_callbacks::on_header_name);
  parser.callbacks.on_header_value.set(test_callbacks::on_header_value);
  parser.callbacks.on_headers.set(test_callbacks::on_headers);
  parser.callbacks.on_upgrade.set(test_callbacks::on_upgrade);
  parser.callbacks.on_chunk_length.set(test_callbacks::on_chunk_length);
  parser
    .callbacks
    .on_chunk_extension_name
    .set(test_callbacks::on_chunk_extension_name);
  parser
    .callbacks
    .on_chunk_extension_value
    .set(test_callbacks::on_chunk_extension_value);
  parser.callbacks.on_body.set(test_callbacks::on_body);
  parser.callbacks.on_data.set(test_callbacks::on_data);
  parser.callbacks.on_trailer_name.set(test_callbacks::on_trailer_name);
  parser.callbacks.on_trailer_value.set(test_callbacks::on_trailer_value);
  parser.callbacks.on_trailers.set(test_callbacks::on_trailers);

  parser
}

pub fn http(input: &str) -> String {
  let trailing_ws = Regex::new(r"(?m)^\s+").unwrap();

  trailing_ws
    .replace_all(input.trim(), "")
    .replace('\n', "")
    .replace("\\r", "\r")
    .replace("\\n", "\n")
    .replace("\\s", " ")
}

pub fn output(input: &str) -> String { input.trim().to_owned() + "\n" }

pub fn parse(parser: &Parser, content: &str) -> usize {
  let mut context = unsafe { Box::from_raw(parser.owner.get() as *mut context::Context) };
  context.input = String::from(content);
  Box::into_raw(context);

  parser.parse(content.as_ptr(), content.len())
}
