use std::os::raw::c_uchar;

#[path = "./callbacks_default.rs"]
mod callbacks;
#[path = "./context.rs"]
mod context;
mod output;

use crate::Parser;

fn extract_payload(parser: &Parser, from: usize, size: usize) -> (*const c_uchar, impl Fn() -> ()) {
  let context = unsafe { Box::from_raw(parser.owner.get() as *mut context::Context) };
  let (ptr, len, cap) = Vec::into_raw_parts(context.input.as_bytes().into());

  Box::into_raw(context);

  return (
    if size > 0 {
      unsafe { ptr.offset(from as isize) }
    } else {
      std::ptr::null()
    },
    move || {
      unsafe { Vec::from_raw_parts(ptr, len, cap) };
    },
  );
}

pub fn before_state_change(parser: &Parser, from: usize, size: usize) -> isize {
  let (payload, cleanup) = extract_payload(parser, from, size);
  let rv = callbacks::before_state_change(parser, payload, size);
  cleanup();
  rv
}

pub fn after_state_change(parser: &Parser, from: usize, size: usize) -> isize {
  let (payload, cleanup) = extract_payload(parser, from, size);
  let rv = callbacks::after_state_change(parser, payload, size);
  cleanup();
  rv
}

pub fn on_message_start(parser: &Parser, from: usize, size: usize) -> isize {
  let (payload, cleanup) = extract_payload(parser, from, size);
  let rv = callbacks::on_message_start(parser, payload, size);
  cleanup();
  rv
}

pub fn on_message_complete(parser: &Parser, from: usize, size: usize) -> isize {
  let (payload, cleanup) = extract_payload(parser, from, size);
  let rv = callbacks::on_message_complete(parser, payload, size);
  cleanup();
  rv
}

pub fn on_error(parser: &Parser, from: usize, size: usize) -> isize {
  let (payload, cleanup) = extract_payload(parser, from, size);
  let rv = callbacks::on_error(parser, payload, size);
  cleanup();
  rv
}

pub fn on_finish(parser: &Parser, from: usize, size: usize) -> isize {
  let (payload, cleanup) = extract_payload(parser, from, size);
  let rv = callbacks::on_finish(parser, payload, size);
  cleanup();
  rv
}

pub fn on_request(parser: &Parser, from: usize, size: usize) -> isize {
  let (payload, cleanup) = extract_payload(parser, from, size);
  let rv = callbacks::on_request(parser, payload, size);
  cleanup();
  rv
}

pub fn on_response(parser: &Parser, from: usize, size: usize) -> isize {
  let (payload, cleanup) = extract_payload(parser, from, size);
  let rv = callbacks::on_response(parser, payload, size);
  cleanup();
  rv
}

pub fn on_method(parser: &Parser, from: usize, size: usize) -> isize {
  let (payload, cleanup) = extract_payload(parser, from, size);
  let rv = callbacks::on_method(parser, payload, size);
  cleanup();
  rv
}

pub fn on_url(parser: &Parser, from: usize, size: usize) -> isize {
  let (payload, cleanup) = extract_payload(parser, from, size);
  let rv = callbacks::on_url(parser, payload, size);
  cleanup();
  rv
}

pub fn on_protocol(parser: &Parser, from: usize, size: usize) -> isize {
  let (payload, cleanup) = extract_payload(parser, from, size);
  let rv = callbacks::on_protocol(parser, payload, size);
  cleanup();
  rv
}

pub fn on_version(parser: &Parser, from: usize, size: usize) -> isize {
  let (payload, cleanup) = extract_payload(parser, from, size);
  let rv = callbacks::on_version(parser, payload, size);
  cleanup();
  rv
}

pub fn on_status(parser: &Parser, from: usize, size: usize) -> isize {
  let (payload, cleanup) = extract_payload(parser, from, size);
  let rv = callbacks::on_status(parser, payload, size);
  cleanup();
  rv
}

pub fn on_reason(parser: &Parser, from: usize, size: usize) -> isize {
  let (payload, cleanup) = extract_payload(parser, from, size);
  let rv = callbacks::on_reason(parser, payload, size);
  cleanup();
  rv
}

pub fn on_header_name(parser: &Parser, from: usize, size: usize) -> isize {
  let (payload, cleanup) = extract_payload(parser, from, size);
  let rv = callbacks::on_header_name(parser, payload, size);
  cleanup();
  rv
}

pub fn on_header_value(parser: &Parser, from: usize, size: usize) -> isize {
  let (payload, cleanup) = extract_payload(parser, from, size);
  let rv = callbacks::on_header_value(parser, payload, size);
  cleanup();
  rv
}

pub fn on_headers(parser: &Parser, from: usize, size: usize) -> isize {
  let (payload, cleanup) = extract_payload(parser, from, size);
  let rv = callbacks::on_headers(parser, payload, size);
  cleanup();
  rv
}

pub fn on_upgrade(parser: &Parser, from: usize, size: usize) -> isize {
  let (payload, cleanup) = extract_payload(parser, from, size);
  let rv = callbacks::on_upgrade(parser, payload, size);
  cleanup();
  rv
}

pub fn on_chunk_length(parser: &Parser, from: usize, size: usize) -> isize {
  let (payload, cleanup) = extract_payload(parser, from, size);
  let rv = callbacks::on_chunk_length(parser, payload, size);
  cleanup();
  rv
}

pub fn on_chunk_extension_name(parser: &Parser, from: usize, size: usize) -> isize {
  let (payload, cleanup) = extract_payload(parser, from, size);
  let rv = callbacks::on_chunk_extension_name(parser, payload, size);
  cleanup();
  rv
}

pub fn on_chunk_extension_value(parser: &Parser, from: usize, size: usize) -> isize {
  let (payload, cleanup) = extract_payload(parser, from, size);
  let rv = callbacks::on_chunk_extension_value(parser, payload, size);
  cleanup();
  rv
}

pub fn on_body(parser: &Parser, from: usize, size: usize) -> isize {
  let (payload, cleanup) = extract_payload(parser, from, size);
  let rv = callbacks::on_body(parser, payload, size);
  cleanup();
  rv
}

pub fn on_data(parser: &Parser, from: usize, size: usize) -> isize {
  let (payload, cleanup) = extract_payload(parser, from, size);
  let rv = callbacks::on_data(parser, payload, size);
  cleanup();
  rv
}

pub fn on_trailer_name(parser: &Parser, from: usize, size: usize) -> isize {
  let (payload, cleanup) = extract_payload(parser, from, size);
  let rv = callbacks::on_trailer_name(parser, payload, size);
  cleanup();
  rv
}

pub fn on_trailer_value(parser: &Parser, from: usize, size: usize) -> isize {
  let (payload, cleanup) = extract_payload(parser, from, size);
  let rv = callbacks::on_trailer_value(parser, payload, size);
  cleanup();
  rv
}

pub fn on_trailers(parser: &Parser, from: usize, size: usize) -> isize {
  let (payload, cleanup) = extract_payload(parser, from, size);
  let rv = callbacks::on_trailers(parser, payload, size);
  cleanup();
  rv
}
