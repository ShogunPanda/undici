#[cfg(test)]
mod test {
  use std::ffi::c_uchar;

  use milo::test_utils::{create_parser, http};
  use milo::{
    Parser, REQUEST, RESPONSE, STATE_ERROR, STATE_FINISH, STATE_HEADER_NAME, STATE_MESSAGE, STATE_REQUEST,
    STATE_RESPONSE, STATE_START,
  };

  #[test]
  fn basic_disable_autodetect() {
    let parser = create_parser();

    let request = http(
      r#"
        PUT /url HTTP/1.1\r\n
        Content-Length: 3\r\n
        \r\n
        abc\r\n\r\n
      "#,
    );

    let response = http(
      r#"
        HTTP/1.1 200 OK\r\n
        Header1: Value1\r\n
        Header2: Value2\r\n
        Content-Length: 3\r\n
        \r\n
        abc\r\n\r\n
      "#,
    );

    parser.mode.set(REQUEST);
    parser.parse(response.as_ptr(), response.len());
    assert!(matches!(parser.state.get(), STATE_ERROR));

    parser.reset(false);

    parser.mode.set(RESPONSE);
    parser.parse(request.as_ptr(), request.len());
    assert!(matches!(parser.state.get(), STATE_ERROR));
  }

  #[test]
  fn basic_incomplete_string_2() {
    let parser = create_parser();

    parser.mode.set(REQUEST);
    let sample1 = http(r#"GE"#);
    let sample2 = http(r#"T / HTTP/1.1\r\nHost: foo\r\n\r\n"#);

    parser.parse(sample1.as_ptr(), sample1.len());
    parser.parse(sample2.as_ptr(), sample2.len());

    assert!(!matches!(parser.state.get(), STATE_ERROR));
  }

  #[test]
  fn basic_incomplete_string() {
    let parser = create_parser();

    let sample1 = http(r#"GET / HTTP/1.1\r"#);
    let sample2 = http(r#"\n"#);
    let sample3 = http(r#"Head"#);
    let sample4 = http(r#"er:"#);
    let sample5 = http(r#"Value"#);
    let sample6 = http(r#"\r\n\r\n"#);

    let consumed1 = parser.parse(sample1.as_ptr(), sample1.len());
    assert!(consumed1 == sample1.len() - 4);
    let consumed2 = parser.parse(sample2.as_ptr(), sample2.len());
    assert!(consumed2 == sample2.len() + 4);
    let consumed3 = parser.parse(sample3.as_ptr(), sample3.len());
    assert!(consumed3 == 0);
    let consumed4 = parser.parse(sample4.as_ptr(), sample4.len());
    assert!(consumed4 == sample3.len() + sample4.len());
    let consumed5 = parser.parse(sample5.as_ptr(), sample5.len());
    assert!(consumed5 == 0);
    let consumed6 = parser.parse(sample6.as_ptr(), sample6.len());
    assert!(consumed6 == sample5.len() + sample6.len());

    assert!(!matches!(parser.state.get(), STATE_ERROR));
  }

  #[test]
  fn basic_sample_multiple_requests() {
    let parser = create_parser();

    let message = http(
      r#"
        POST /chunked_w_unicorns_after_length HTTP/1.1\r\n
        Transfer-Encoding: chunked\r\n
        \r\n
        5;ilovew3;somuchlove=aretheseparametersfor\r\n
        hello\r\n
        7;blahblah;blah\r\n
        \s world\r\n
        0\r\n\r\n
        \r\n
        POST / HTTP/1.1\r\n
        Host: www.example.com\r\n
        Content-Type: application/x-www-form-urlencoded\r\n
        Content-Length: 4\r\n
        \r\n
        q=42\r\n
        \r\n
        GET / HTTP/1.1\r\n\r\n
      "#,
    );

    parser.parse(message.as_ptr(), message.len());
    assert!(!matches!(parser.state.get(), STATE_ERROR));
  }

  #[test]
  fn basic_connection_close() {
    let parser = create_parser();

    let message = http(
      r#"
        POST /chunked_w_unicorns_after_length HTTP/1.1\r\n
        Connection: close\r\n
        Transfer-Encoding: chunked\r\n
        \r\n
        5;ilovew3;somuchlove=aretheseparametersfor\r\n
        hello\r\n
        7;blahblah;blah\r\n
        \s world\r\n
        0\r\n\r\n
      "#,
    );

    parser.parse(message.as_ptr(), message.len());
    assert!(matches!(parser.state.get(), STATE_FINISH));
  }

  #[test]
  fn basic_sample_multiple_responses() {
    let parser = create_parser();

    let message = http(
      r#"
        HTTP/1.1 200 OK\r\n
        Header1: Value1\r\n
        Header2: Value2\r\n
        Content-Length: 3\r\n
        \r\n
        abc\r\n\r\n
        HTTP/1.1 200 OK\r\n
        Header1: Value1\r\n
        Header2: Value2\r\n
        Content-Length: 3\r\n
        \r\n
        abc\r\n
        HTTP/1.1 200 OK\r\n
        Header1: Value1\r\n
        Header2: Value2\r\n
        Content-Length: 3\r\n
        \r\n
        abc\r\n\r\n
      "#,
    );

    parser.parse(message.as_ptr(), message.len());
    assert!(!matches!(parser.state.get(), STATE_ERROR));
  }

  #[test]
  fn basic_trailers() {
    let parser = create_parser();

    let message = http(
      r#"
        POST /chunked_w_unicorns_after_length HTTP/1.1\r\n
        Transfer-Encoding: chunked\r\n
        Trailer: host,cache-control\r\n
        \r\n
        5;ilovew3;somuchlove="arethesepara\"metersfor";another="1111\"2222\"3333"\r\n
        hello\r\n
        7;blahblah;blah;somuchlove="arethesepara"\r\n
        \s world\r\n
        0\r\n
        Host: example.com\r\n
        Cache-Control: private\r\n\r\n
      "#,
    );

    parser.parse(message.as_ptr(), message.len());
    assert!(!matches!(parser.state.get(), STATE_ERROR));
  }

  #[test]
  fn incomplete_body() {
    let parser = create_parser();

    let sample1 = http(r#"POST / HTTP/1.1\r\nContent-Length: 10\r\n\r\n12345"#);
    let sample2 = http(r#"67"#);
    let sample3 = http(r#"890\r\n"#);

    let consumed1 = parser.parse(sample1.as_ptr(), sample1.len());
    assert!(consumed1 == sample1.len());
    let consumed2 = parser.parse(sample2.as_ptr(), sample2.len());
    assert!(consumed2 == sample2.len());
    let consumed3 = parser.parse(sample3.as_ptr(), sample3.len());
    assert!(consumed3 == sample3.len());

    assert!(!matches!(parser.state.get(), STATE_ERROR));
  }

  #[test]
  fn incomplete_chunk() {
    let parser = create_parser();

    let sample1 = http(r#"POST / HTTP/1.1\r\nTransfer-Encoding: chunked\r\nTrailer: x-foo\r\n\r\na\r\n12345"#);
    let sample2 = http(r#"67"#);
    let sample3 = http(r#"890\r\n0\r\nx-foo: value\r\n\r\n"#);

    let consumed1 = parser.parse(sample1.as_ptr(), sample1.len());
    assert!(consumed1 == sample1.len());
    let consumed2 = parser.parse(sample2.as_ptr(), sample2.len());
    assert!(consumed2 == sample2.len());
    let consumed3 = parser.parse(sample3.as_ptr(), sample3.len());
    assert!(consumed3 == sample3.len());

    assert!(!matches!(parser.state.get(), STATE_ERROR));
  }

  #[test]
  fn connection_header() {
    let parser = create_parser();

    let close_connection = http(
      r#"
        PUT /url HTTP/1.1\r\n
        Content-Length: 3\r\n
        Connection: close\r\n
        \r\n
        abc
      "#,
    );

    parser.parse(close_connection.as_ptr(), close_connection.len());
    assert!(matches!(parser.state.get(), STATE_FINISH));

    parser.reset(false);

    let keep_alive_connection = http(
      r#"
        PUT /url HTTP/1.1\r\n
        Content-Length: 3\r\n
        \r\n
        abc
      "#,
    );

    parser.parse(keep_alive_connection.as_ptr(), keep_alive_connection.len());
    assert!(matches!(parser.state.get(), STATE_MESSAGE));
  }

  #[test]
  fn pause_and_resume() {
    let parser = create_parser();

    let sample1 = http(
      r#"
        PUT /url HTTP/1.1\r\n
        Content-Length: 3\r\n
      "#,
    );
    let sample2 = http(r#"\r\nabc"#); // This will be paused before the body
    let sample3 = http(r#"abc"#);

    parser
      .callbacks
      .on_headers
      .set(|p: &Parser, _data: *const c_uchar, _size: usize| -> isize {
        println!("CALLED\n\n");
        p.pause();
        0
      });

    assert!(!parser.paused.get());

    let consumed1 = parser.parse(sample1.as_ptr(), sample1.len());
    assert!(consumed1 == sample1.len());

    assert!(!parser.paused.get());
    let consumed2 = parser.parse(sample2.as_ptr(), sample2.len());
    assert!(consumed2 == sample2.len() - 3);
    assert!(parser.paused.get());

    let consumed3 = parser.parse(sample3.as_ptr(), sample3.len());
    assert!(consumed3 == 0);

    assert!(parser.paused.get());
    parser.resume();
    assert!(!parser.paused.get());

    let consumed4 = parser.parse(sample3.as_ptr(), sample3.len());
    assert!(consumed4 == sample3.len());
    assert!(!parser.paused.get());

    assert!(!matches!(parser.state.get(), STATE_ERROR));
  }

  #[test]
  fn restart() {
    let parser = create_parser();
    parser.mode.set(RESPONSE);

    let response = http(
      r#"
        HTTP/1.1 200 OK\r\n
        Header1: Value1\r\n
        Header2: Value2\r\n
        Content-Length: 3\r\n
        \r\n
        abc\r\n\r\n
        HTTP/1.1 200 OK\r\n
        Header1: Value1\r\n
        Header2: Value2\r\n
        Content-Length: 3\r\n
        \r\n
        abc\r\n
        HTTP/1.1 200 OK\r\n
        Header1: Value1\r\n
        Header2: Value2\r\n
        Content-Length: 3\r\n
        \r\n
        abc\r\n\r\n
      "#,
    );

    let request = http(
      r#"
        PUT /url HTTP/1.1\r\n
        Content-Length: 3\r\n
        Connection: keep-alive\r\n
        \r\n
        abc
      "#,
    );

    parser.parse(response.as_ptr(), response.len());
    assert!(matches!(parser.state.get(), STATE_RESPONSE));

    parser.mode.set(REQUEST);
    parser.reset(false);

    parser.parse(request.as_ptr(), request.len());
    assert!(matches!(parser.state.get(), STATE_REQUEST));
  }

  #[test]
  fn finish() {
    let parser = create_parser();

    assert!(matches!(parser.state.get(), STATE_START));
    parser.finish();
    assert!(matches!(parser.state.get(), STATE_FINISH));

    parser.reset(false);

    let close_connection = http(
      r#"
        PUT /url HTTP/1.1\r\n
        Content-Length: 3\r\n
        Connection: close\r\n
        \r\n
        abc
      "#,
    );

    parser.parse(close_connection.as_ptr(), close_connection.len());
    assert!(matches!(parser.state.get(), STATE_FINISH));
    parser.finish();
    assert!(matches!(parser.state.get(), STATE_FINISH));

    parser.reset(false);

    let keep_alive_connection = http(
      r#"
        PUT /url HTTP/1.1\r\n
        Content-Length: 3\r\n
        \r\n
        abc
      "#,
    );

    parser.parse(keep_alive_connection.as_ptr(), keep_alive_connection.len());
    assert!(matches!(parser.state.get(), STATE_MESSAGE));
    parser.finish();
    assert!(matches!(parser.state.get(), STATE_FINISH));

    parser.reset(false);

    let incomplete = http(
      r#"
        PUT /url HTTP/1.1\r\n
      "#,
    );

    parser.parse(incomplete.as_ptr(), incomplete.len());

    assert!(matches!(parser.state.get(), STATE_HEADER_NAME));
    parser.finish();
    assert!(matches!(parser.state.get(), STATE_ERROR));
  }
}
