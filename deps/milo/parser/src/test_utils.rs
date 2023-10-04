use std::os::raw::c_uchar;
use std::os::raw::c_void;
use std::slice;
use std::str;

use regex::Regex;

use crate::{Parser, RESPONSE};

struct Context {
  output: String,
  method: String,
  url: String,
  protocol: String,
  version: String,
}

impl Context {
  fn new() -> Context {
    Context {
      output: String::new(),
      method: String::new(),
      url: String::new(),
      protocol: String::new(),
      version: String::new(),
    }
  }
}

fn format_event(name: &str) -> String { format!("{}", format!("\"{}\"", name)) }

fn append_output(parser: &Parser, message: String, data: *const c_uchar, size: usize) -> isize {
  println!(
    "{{ {}, \"data\": {} }}",
    message,
    if !data.is_null() {
      format!("\"{}\"", unsafe {
        str::from_utf8_unchecked(slice::from_raw_parts(data, size))
      })
    } else {
      "null".into()
    },
  );

  let mut context = unsafe { Box::from_raw(parser.owner.get() as *mut Context) };
  context.output.push_str((message + "\n").as_str());
  parser.owner.set(Box::into_raw(context) as *mut c_void);

  0
}

fn event(parser: &Parser, name: &str, data: *const c_uchar, size: usize) -> isize {
  append_output(
    parser,
    format!("\"pos\": {}, \"event\": {}", parser.position.get(), name),
    data,
    size,
  )
}

fn show_span(parser: &Parser, name: &str, data: *const c_uchar, size: usize) -> isize {
  if name == "method" || name == "url" || name == "protocol" || name == "version" {
    let mut context = unsafe { Box::from_raw(parser.owner.get() as *mut Context) };
    let value = unsafe { String::from_utf8_unchecked(slice::from_raw_parts(data, size).into()) };

    match name {
      "method" => {
        context.method = value;
      }
      "url" => {
        context.url = value;
      }
      "protocol" => {
        context.protocol = value;
      }
      "version" => {
        context.version = value;
      }
      _ => {}
    }

    parser.owner.set(Box::into_raw(context) as *mut c_void);
  }

  event(parser, name, data, size)
}

fn on_message_start(parser: &Parser, data: *const c_uchar, size: usize) -> isize { event(parser, "begin", data, size) }

fn on_message_complete(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  event(parser, "complete", data, size)
}

fn on_error(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  unsafe {
    append_output(
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

fn on_finish(parser: &Parser, data: *const c_uchar, size: usize) -> isize { event(parser, "finish", data, size) }

fn on_request(parser: &Parser, data: *const c_uchar, size: usize) -> isize { event(parser, "request", data, size) }

fn on_response(parser: &Parser, data: *const c_uchar, size: usize) -> isize { event(parser, "response", data, size) }

fn on_method(parser: &Parser, data: *const c_uchar, size: usize) -> isize { show_span(parser, "method", data, size) }

fn on_url(parser: &Parser, data: *const c_uchar, size: usize) -> isize { show_span(parser, "url", data, size) }

fn on_protocol(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  show_span(parser, "protocol", data, size)
}

fn on_version(parser: &Parser, data: *const c_uchar, size: usize) -> isize { show_span(parser, "version", data, size) }

fn on_status(parser: &Parser, data: *const c_uchar, size: usize) -> isize { show_span(parser, "status", data, size) }

fn on_reason(parser: &Parser, data: *const c_uchar, size: usize) -> isize { show_span(parser, "reason", data, size) }

fn on_header_name(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  show_span(parser, "header_name", data, size)
}

fn on_header_value(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  show_span(parser, "header_value", data, size)
}

fn on_headers(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  let context = unsafe { Box::from_raw(parser.owner.get() as *mut Context) };

  let position = parser.position.get();
  let chunked = parser.has_chunked_transfer_encoding.get();
  let content_length = parser.content_length.get();
  let method = context.method.clone();
  let url = context.url.clone();
  let protocol = context.protocol.clone();
  let version = context.version.clone();

  parser.owner.set(Box::into_raw(context) as *mut c_void);

  if parser.message_type.get() == RESPONSE {
    let heading = format!(
      "\"pos\": {}, \"event\": {}, \"type\": \"response\", ",
      position,
      format_event("headers")
    );

    if chunked {
      append_output(
        parser,
        format!(
          "{}\"status\": \"{}\", \"protocol\": \"{}\" \"version\": \"{}\", \"body\": \"chunked\"",
          heading,
          parser.status.get(),
          protocol,
          version,
        ),
        data,
        size,
      )
    } else if content_length > 0 {
      append_output(
        parser,
        format!(
          "{}\"status\": \"{}\", \"protocol\": \"{}\" \"version\": \"{}\", \"body\": {}\"",
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
      append_output(
        parser,
        format!(
          "{}\"status\": \"{}\", \"protocol\": \"{}\" \"version\": \"{}\", \"body\": null",
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
      format_event("headers")
    );

    if chunked {
      append_output(
        parser,
        format!(
          "{}\"method\": \"{}\", \"url\": \"{}\" \"protocol\": \"{}\", \"version\": \"{}\", \"body\": \"chunked\"",
          heading, method, url, protocol, version,
        ),
        data,
        size,
      )
    } else if content_length > 0 {
      append_output(
        parser,
        format!(
          "{}\"method\": \"{}\", \"url\": \"{}\" \"protocol\": \"{}\", \"version\": \"{}\", \"body\": {}",
          heading, method, url, protocol, version, content_length
        ),
        data,
        size,
      )
    } else {
      append_output(
        parser,
        format!(
          "{}\"method\": \"{}\", \"url\": \"{}\" \"protocol\": \"{}\", \"version\": \"{}\", \"body\": null",
          heading, method, url, protocol, version,
        ),
        data,
        size,
      )
    }
  }
}

fn on_upgrade(parser: &Parser, data: *const c_uchar, size: usize) -> isize { event(parser, "upgrade", data, size) }

fn on_chunk_length(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  show_span(parser, "chunk_length", data, size)
}

fn on_chunk_extension_name(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  show_span(parser, "chunk_extensions_name", data, size)
}

fn on_chunk_extension_value(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  show_span(parser, "chunk_extension_value", data, size)
}

fn on_body(parser: &Parser, data: *const c_uchar, size: usize) -> isize { event(parser, "body", data, size) }

fn on_data(parser: &Parser, data: *const c_uchar, size: usize) -> isize { show_span(parser, "data", data, size) }

fn on_trailer_name(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  show_span(parser, "trailer_name", data, size)
}

fn on_trailer_value(parser: &Parser, data: *const c_uchar, size: usize) -> isize {
  show_span(parser, "trailer_value", data, size)
}

fn on_trailers(parser: &Parser, data: *const c_uchar, size: usize) -> isize { event(parser, "trailers", data, size) }

pub fn create_parser() -> Parser {
  let parser = Parser::new();
  let context = Box::new(Context::new());
  parser.owner.set(Box::into_raw(context) as *mut c_void);

  parser.callbacks.on_error.set(on_error);
  parser.callbacks.on_finish.set(on_finish);
  parser.callbacks.on_request.set(on_request);
  parser.callbacks.on_response.set(on_response);
  parser.callbacks.on_message_start.set(on_message_start);
  parser.callbacks.on_message_complete.set(on_message_complete);
  parser.callbacks.on_method.set(on_method);
  parser.callbacks.on_url.set(on_url);
  parser.callbacks.on_protocol.set(on_protocol);
  parser.callbacks.on_version.set(on_version);
  parser.callbacks.on_status.set(on_status);
  parser.callbacks.on_reason.set(on_reason);
  parser.callbacks.on_header_name.set(on_header_name);
  parser.callbacks.on_header_value.set(on_header_value);
  parser.callbacks.on_headers.set(on_headers);
  parser.callbacks.on_upgrade.set(on_upgrade);
  parser.callbacks.on_chunk_length.set(on_chunk_length);
  parser.callbacks.on_chunk_extension_name.set(on_chunk_extension_name);
  parser.callbacks.on_chunk_extension_value.set(on_chunk_extension_value);
  parser.callbacks.on_body.set(on_body);
  parser.callbacks.on_data.set(on_data);
  parser.callbacks.on_trailer_name.set(on_trailer_name);
  parser.callbacks.on_trailer_value.set(on_trailer_value);
  parser.callbacks.on_trailers.set(on_trailers);

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
