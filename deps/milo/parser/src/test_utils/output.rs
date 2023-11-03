use std::os::raw::c_uchar;
use std::slice;
use std::str;

use crate::Parser;

#[path = "./context.rs"]
mod context;

#[allow(dead_code)]
pub fn format_event(name: &str) -> String { format!("{}", format!("\"{}\"", name)) }

#[allow(dead_code)]
pub fn append_output(parser: &Parser, message: String, data: *const c_uchar, size: usize) -> isize {
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

  let mut context = unsafe { Box::from_raw(parser.owner.get() as *mut context::Context) };
  context.output.push_str((message + "\n").as_str());
  Box::into_raw(context);

  0
}

#[allow(dead_code)]
pub fn event(parser: &Parser, name: &str, data: *const c_uchar, size: usize) -> isize {
  append_output(
    parser,
    format!("\"pos\": {}, \"event\": \"{}\"", parser.position.get(), name),
    data,
    size,
  )
}

#[allow(dead_code)]
pub fn show_span(parser: &Parser, name: &str, data: *const c_uchar, size: usize) -> isize {
  if name == "method" || name == "url" || name == "protocol" || name == "version" {
    let mut context = unsafe { Box::from_raw(parser.owner.get() as *mut context::Context) };
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

    Box::into_raw(context);
  }

  event(parser, name, data, size)
}
