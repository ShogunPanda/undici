#[cfg(all(test, feature = "no-copy"))]
mod test {
  use milo::test_utils::{create_parser, http, parse};
  use milo::{REQUEST, STATE_ERROR};

  #[test]
  fn basic_incomplete_string() {
    let parser = create_parser();

    let sample1 = http(r#"GET / HTTP/1.1\r"#);
    let sample2 = http(r#"1.1\r\n"#);
    let sample3 = http(r#"Head"#);
    let sample4 = http(r#"Header:"#);
    let sample5 = http(r#"Value"#);
    let sample6 = http(r#"Value\r\n\r\n"#);

    let consumed1 = parse(&parser, &sample1);
    assert!(consumed1 == sample1.len() - 4);
    let consumed2 = parse(&parser, &sample2);
    assert!(consumed2 == sample2.len());
    let consumed3 = parse(&parser, &sample3);
    assert!(consumed3 == 0);
    let consumed4 = parse(&parser, &sample4);
    assert!(consumed4 == sample4.len());
    let consumed5 = parse(&parser, &sample5);
    assert!(consumed5 == 0);
    let consumed6 = parse(&parser, &sample6);
    assert!(consumed6 == sample6.len());

    assert!(!matches!(parser.state.get(), STATE_ERROR));
  }

  #[test]
  fn basic_incomplete_string_2() {
    let parser = create_parser();

    parser.mode.set(REQUEST);
    let sample1 = http(r#"GE"#);
    let sample2 = http(r#"GET / HTTP/1.1\r\nHost: foo\r\n\r\n"#);

    let consumed1 = parse(&parser, &sample1);
    assert!(consumed1 == 0);

    let consumed2 = parse(&parser, &sample2);
    assert!(consumed2 == sample2.len());

    assert!(!matches!(parser.state.get(), STATE_ERROR));
  }
}
