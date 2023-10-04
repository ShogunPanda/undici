mod parsing;

use std::fs::File;
use std::path::Path;
use std::sync::OnceLock;
use std::{collections::HashMap, ffi::c_uchar};

use indexmap::IndexSet;
use parsing::{Failure, Identifiers, IdentifiersWithExpr, IdentifiersWithStatements, StringLength};
use proc_macro::TokenStream;
use quote::{format_ident, quote};
use regex::{Captures, Regex};
use syn::{parse_macro_input, parse_str, Arm, Expr, Ident, ItemConst, LitByte, LitChar, LitInt, LitStr, Stmt};

// Global state variables for later use
static METHODS: OnceLock<Vec<String>> = OnceLock::new();
static mut ERRORS: OnceLock<IndexSet<String>> = OnceLock::new();
static mut CALLBACKS: OnceLock<IndexSet<String>> = OnceLock::new();
static mut STATES: OnceLock<IndexSet<String>> = OnceLock::new();
static mut MIXINS: OnceLock<HashMap<String, Vec<String>>> = OnceLock::new();

/// Takes a state name and returns its state variant, which is its uppercased
/// version.
fn format_state(ident: &Ident) -> Ident { format_ident!("{}", ident.to_string().to_uppercase()) }

fn init_constants() {
  unsafe {
    METHODS.get_or_init(|| {
      let mut absolute_path = Path::new(file!()).parent().unwrap().to_path_buf();
      absolute_path.push("methods.yml");
      let f = File::open(absolute_path.to_str().unwrap()).unwrap();

      serde_yaml::from_reader(f).unwrap()
    });

    ERRORS.get_or_init(|| IndexSet::new());
    CALLBACKS.get_or_init(|| IndexSet::new());
    STATES.get_or_init(|| IndexSet::new());
    MIXINS.get_or_init(|| HashMap::new());
  }
}

// #region definitions
/// Adds one or more new error codes.
#[proc_macro]
pub fn errors(input: TokenStream) -> TokenStream {
  let definition = parse_macro_input!(input with Identifiers::unbound);

  init_constants();

  unsafe {
    let errors = ERRORS.get_mut().unwrap();
    for error in definition.identifiers {
      errors.insert(error.to_string().to_uppercase());
    }
  }

  TokenStream::new()
}

/// Adds one or more new callback.
#[proc_macro]
pub fn callbacks(input: TokenStream) -> TokenStream {
  let definition = parse_macro_input!(input with Identifiers::unbound);

  init_constants();

  unsafe {
    let callbacks = CALLBACKS.get_mut().unwrap();
    for cb in definition.identifiers {
      callbacks.insert(cb.to_string());
    }
  }

  TokenStream::new()
}

/// Adds time measurement to a code block.
#[proc_macro]
pub fn measure(input: TokenStream) -> TokenStream {
  let definition = parse_macro_input!(input as IdentifiersWithStatements);
  let name = definition.name.to_string();
  let statements = definition.statements;

  TokenStream::from(quote! {
    {
      let mut start = SystemTime::now();

      let res = { #(#statements)* };

      let duration = SystemTime::now().duration_since(start).unwrap().as_nanos();

      println!("[milo::debug] {} completed in {} ns", #name, duration);
      res
    }
  })
}

/// Defines a new state.
#[proc_macro]
pub fn state(input: TokenStream) -> TokenStream {
  let definition = parse_macro_input!(input as IdentifiersWithStatements);
  let name = definition.name;
  let function = format_ident!("state_{}", name);
  let statements = definition.statements;

  init_constants();

  unsafe {
    STATES.get_mut().unwrap().insert(name.to_string().to_uppercase());
  }

  TokenStream::from(quote! {
    #[inline(always)]
    fn #function (parser: &Parser, data: &[c_uchar]) -> isize {
      let mut data = data;
      #(#statements)*
    }
  })
}

/// Defines a new mixin.
#[proc_macro]
pub fn mixin(input: TokenStream) -> TokenStream {
  let definition = parse_macro_input!(input as IdentifiersWithStatements);
  let name = definition.name;
  let statements = definition.statements;

  init_constants();

  unsafe {
    MIXINS.get_mut().unwrap().insert(
      name.to_string(),
      statements.iter().map(|x| quote! { #x }.to_string()).collect(),
    );
  }

  TokenStream::new()
}
// #endregion definitions

// #region matchers
/// Matches a character.
#[proc_macro]
pub fn char(input: TokenStream) -> TokenStream {
  let character = parse_macro_input!(input as LitChar);
  let byte = LitByte::new(c_uchar::try_from(character.value()).unwrap(), character.span());

  TokenStream::from(quote! { #byte })
}

/// Matches a digit in base 10.
#[proc_macro]
pub fn digit(_input: TokenStream) -> TokenStream { TokenStream::from(quote! { 0x30..=0x39 }) }

/// Matches a digit in base 16.
#[proc_macro]
pub fn hex_digit(_input: TokenStream) -> TokenStream {
  TokenStream::from(quote! { 0x30..=0x39 | 0x41..=0x46 | 0x61..=0x66 })
}

/// Matches a string in case sensitive way.
#[proc_macro]
pub fn string(input: TokenStream) -> TokenStream {
  let definition = parse_macro_input!(input as LitStr);
  let bytes: Vec<_> = definition
    .value()
    .bytes()
    .map(|b| LitByte::new(b, definition.span()))
    .collect();

  TokenStream::from(quote! { [#(#bytes),*, ..] })
}

/// Matches a string in case insensitive way.
#[proc_macro]
pub fn case_insensitive_string(input: TokenStream) -> TokenStream {
  let definition = parse_macro_input!(input as LitStr);

  let bytes: Vec<_> = definition
    .value()
    .bytes()
    .map(|b| parse_str::<Expr>(&format!("{} | {}", b.to_ascii_uppercase(), b.to_ascii_lowercase())).unwrap())
    .collect();

  TokenStream::from(quote! { [#(#bytes),*, ..] })
}

/// Matches a "CR LF" sequence.
#[proc_macro]
pub fn crlf(_: TokenStream) -> TokenStream { TokenStream::from(quote! { [b'\r', b'\n', ..] }) }

/// Matches a "CR LF CR LF" sequence.
#[proc_macro]
pub fn double_crlf(_: TokenStream) -> TokenStream { TokenStream::from(quote! { [b'\r', b'\n', b'\r', b'\n', ..] }) }

/// Matches a token according to RFC 9110 section 5.6.2 and RFC 5234 appendix
/// B.1.
///
/// DIGIT | ALPHA | OTHER_TOKENS
/// DIGIT = 0x30 - 0x39
/// ALPHA = 0x41-0x5A, 0x61 - 0x7A
/// OTHER_TOKENS = '!' | '#' | '$' | '%' | '&' | '\'' | '*' | '+' | '-' | '.' |
/// '^' | '_' | '`' | '|' | '~'
#[proc_macro]
pub fn token(_input: TokenStream) -> TokenStream {
  TokenStream::from(quote! {
    0x30..=0x39 |
    0x41..=0x5A |
    0x61..=0x7A |
    b'!' | b'#' | b'$' | b'%' | b'&' | b'\'' | b'*' | b'+' | b'-' | b'.' | b'^' | b'_' | b'`' | b'|' | b'~'
  })
}

/// Matches a token according to RFC 9112 section 4.
///
/// HTAB / SP / VCHAR / obs-text
#[proc_macro]
pub fn token_value(_input: TokenStream) -> TokenStream {
  // RFC 9112 section 4
  //
  TokenStream::from(quote! { b'\t' | b' ' | 0x21..=0x7e | 0x80..=0xff })
}

/// Matches a method according to HTTP and RTSP standards.
///
/// HTTP = https://www.iana.org/assignments/http-methods (RFC 9110 section 16.1.1)
/// RTSP = RFC 7826 section 7.1
#[proc_macro]
pub fn method(input: TokenStream) -> TokenStream {
  let output: Vec<_> = if input.is_empty() {
    METHODS.get().unwrap().iter().map(|x| quote! { string!(#x) }).collect()
  } else {
    let identifier = parse_macro_input!(input as Ident);
    METHODS
      .get()
      .unwrap()
      .iter()
      .map(|x| quote! { #identifier @ string!(#x) })
      .collect()
  };

  TokenStream::from(quote! { #(#output)|* })
}

/// Matches a method according to RFC 3986 appendix A and RFC 5234 appendix B.1.
///
/// DIGIT | ALPHA | OTHER_UNRESERVED_AND_RESERVED
/// DIGIT = 0x30 - 0x39
/// ALPHA = 0x41-0x5A, 0x61 - 0x7A
/// OTHER_UNRESERVED_AND_RESERVED = '-' | '.' | '_' | '~' | ':' | '/' | '?' |
/// '#' | '[' | ']' | '@' | '!' | '$' | '&' | ''' | '(' | ')' | '*' | '+' | ','
/// | ';' | '=' | '%'
#[proc_macro]
pub fn url(_input: TokenStream) -> TokenStream {
  TokenStream::from(quote! {
    0x30..=0x39 |
    0x41..=0x5A |
    0x61..=0x7A |
    b'-' | b'.' | b'_' | b'~' | b':' | b'/' | b'?' | b'#' | b'[' | b']' | b'@' | b'!' | b'$' | b'&' | b'\'' | b'(' | b')' | b'*' | b'+' | b',' | b';' | b'=' | b'%'
  })
}

/// Matches any sequence of N characters. This is used as failure state when at
/// least N characters are available.
#[proc_macro]
pub fn otherwise(input: TokenStream) -> TokenStream {
  let definition = parse_macro_input!(input as LitInt);
  let tokens = definition.base10_parse::<usize>().unwrap();
  let quotes: Vec<_> = (0..tokens).map(|x| format_ident!("_u{}", format!("{}", x))).collect();

  TokenStream::from(quote! { [ #(#quotes),*, .. ] })
}
// #endregion matchers

// #region actions
/// Insert a previously defined mixing
#[proc_macro]
pub fn use_mixin(input: TokenStream) -> TokenStream {
  let name = parse_macro_input!(input as Ident).to_string();
  let statements = unsafe {
    MIXINS
      .get()
      .unwrap()
      .get(&name)
      .expect(&format!("Mixin {} not found.", name))
  };

  let parsed = statements.iter().map(|x| parse_str::<Stmt>(x).unwrap());

  TokenStream::from(quote! { #(#parsed)* })
}

/// Returns the length of an input string.
#[proc_macro]
pub fn string_length(input: TokenStream) -> TokenStream {
  let definition = parse_macro_input!(input as StringLength);

  let len = definition.string.value().len() as usize + definition.modifier;

  TokenStream::from(quote! { #len })
}

#[proc_macro]
/// Moves the parsers to a new state and marks a certain number of characters as
/// used.
pub fn move_to(input: TokenStream) -> TokenStream {
  let definition = parse_macro_input!(input as IdentifiersWithExpr);
  let state = format_state(&definition.identifier);

  #[cfg(debug_assertions)]
  {
    if let Some(expr) = definition.expr {
      TokenStream::from(quote! { parser.move_to(State::#state, (#expr) as isize) })
    } else {
      TokenStream::from(quote! { parser.move_to(State::#state, 1) })
    }
  }

  #[cfg(not(debug_assertions))]
  {
    if let Some(expr) = definition.expr {
      TokenStream::from(quote! {
        {
          parser.state.set(State::#state);
          (#expr) as isize
        }
      })
    } else {
      TokenStream::from(quote! {
        {
          parser.state.set(State::#state);
          1
        }
      })
    }
  }
}

/// Marks the parsing a failed, setting a error code and and error message.
#[proc_macro]
pub fn fail(input: TokenStream) -> TokenStream {
  let definition = parse_macro_input!(input as Failure);
  let error = definition.error;
  let message = definition.message;

  if let Expr::Lit(_) = message {
    TokenStream::from(quote! { parser.fail_str(Error::#error, #message) })
  } else {
    TokenStream::from(quote! { parser.fail(Error::#error, #message) })
  }
}

/// Tries to detect the longest prefix of the data matching the provided
/// selector.
///
/// The `consumed` variable will contain the length of the prefix.
///
/// If all input data matched the selector, the parser will pause to allow eager
/// parsing, in this case the parser must be resumed.

#[proc_macro]
pub fn consume(input: TokenStream) -> TokenStream {
  let definition = parse_macro_input!(input as Expr);

  TokenStream::from(quote! {
    let mut consumed = 0;
    let max = data.len();

    while consumed < max {
      if let #definition = data[consumed] {
        consumed += 1;
      } else {
        break
      }
    }

    if(consumed == max) {
      return SUSPEND;
    }
  })
}

fn callback_internal(input: TokenStream, return_on_error: bool, use_self: bool) -> TokenStream {
  let definition = parse_macro_input!(input as IdentifiersWithExpr);
  let callback = definition.identifier;
  let callback_name = callback.to_string();

  let parser = if use_self {
    format_ident!("self")
  } else {
    format_ident!("parser")
  };

  let validate_wasm = if return_on_error {
    quote! {
      if let Err(err) = ret {
        return #parser.fail(Error::CALLBACK_ERROR, format!("The callback for {} has failed: {}.", #callback_name, err.as_string().unwrap()));
      }

      let value = ret.unwrap().as_f64();

      if let None = value {
        return #parser.fail(Error::CALLBACK_ERROR, format!("The callback for {} must return a number.", #callback_name));
      }

      value.unwrap() as isize
    }
  } else {
    quote! {
      match ret {
        Ok(value) => {
          match value.as_f64() {
            Some(number) => number as isize,
            None => {
              #parser.fail(Error::CALLBACK_ERROR, format!("The callback for {} must return a number.", #callback_name));
              0 as isize
            }
          }
        }
        Err(err) => {
          #parser.fail(Error::CALLBACK_ERROR, format!("The callback for {} has failed: {}.", #callback_name, err.as_string().unwrap()));
          0 as isize
        }
      }
    }
  };

  let (invocation, invocation_wasm) = if let Some(length) = definition.expr {
    (
      quote! {
        (#parser.callbacks.#callback.get())(#parser, data.as_ptr(), (#length) as usize)
      },
      quote! {
        {
          // Handle when the return value is not an integer
          let ret = #parser.callbacks.#callback.call2(&JsValue::NULL, unsafe { &Uint8Array::view(data) }, &JsValue::from(#length));
          #validate_wasm
        }
      },
    )
  } else {
    (
      quote! {
        (#parser.callbacks.#callback.get())(#parser, ptr::null(), 0)
      },
      quote! {
        {
          let ret = #parser.callbacks.#callback.call0(&JsValue::NULL);
          #validate_wasm
        }
      },
    )
  };

  let error_handling = if return_on_error {
    quote! {
      return #parser.fail(
        Error::CALLBACK_ERROR,
        format!("Callback {} failed with return value {}.", #callback_name, invocation_result),
      );
    }
  } else {
    quote! {
      #parser.fail(
        Error::CALLBACK_ERROR,
        format!("Callback {} failed with return value {}.", #callback_name, invocation_result),
      );
    }
  };

  TokenStream::from(quote! {
    #[cfg(not(target_family = "wasm"))]
    let invocation_result = #invocation;

    #[cfg(target_family = "wasm")]
    let invocation_result = #invocation_wasm;

    if invocation_result != 0 {
      #error_handling
    }
  })
}

/// Invokes one of the user defined callbacks, eventually attaching some view of
/// the data (via pointer and length). If the callback errors, the operation is
/// NOT interrupted.
#[proc_macro]
pub fn callback(input: TokenStream) -> TokenStream { callback_internal(input, true, false) }

/// Invokes one of the user defined callbacks, eventually attaching some view of
/// the data (via pointer and length). If the callback errors, the operation is
/// NOT interrupted.
#[proc_macro]
pub fn callback_no_return(input: TokenStream) -> TokenStream { callback_internal(input, false, true) }

/// Marks the parser as suspended, waiting for more data.
#[proc_macro]
pub fn suspend(_input: TokenStream) -> TokenStream { TokenStream::from(quote! { SUSPEND }) }

/// Maps a string method to its integer value (which is the enum definition
/// index).
#[proc_macro]
pub fn find_method(input: TokenStream) -> TokenStream {
  let identifier = parse_macro_input!(input as Expr);

  init_constants();

  let methods: Vec<_> = METHODS
    .get()
    .unwrap()
    .iter()
    .enumerate()
    .map(|(i, x)| {
      let matcher = x
        .chars()
        .map(|b| format!("b'{}'", b))
        .collect::<Vec<String>>()
        .join(", ");

      if x == "CONNECT" {
        parse_str::<Arm>(&format!(
          "[{}, ..] => {{ parser.is_connect.set(true); {} }}",
          matcher, i
        ))
        .unwrap()
      } else {
        parse_str::<Arm>(&format!("[{}, ..] => {{ {} }}", matcher, i)).unwrap()
      }
    })
    .collect();

  TokenStream::from(quote! {
    let method = match #identifier {
      #(#methods),*
      _ => {
        return fail!(UNEXPECTED_CHARACTER, "Invalid method")
      }
    };
  })
}
// #endregion actions

// #region generators
/// Returns the initial state of the parser, which is the first defined state.
#[proc_macro]
pub fn initial_state(_input: TokenStream) -> TokenStream {
  let initial_state = unsafe { format_ident!("{}", STATES.get().unwrap()[0]) };

  TokenStream::from(quote! { State::#initial_state })
}

/// Returns a match statement which executes the block of the parser's current
/// state.
#[proc_macro]
pub fn apply_state(_input: TokenStream) -> TokenStream {
  // Generate all the branches
  let states_arms: Vec<_> = unsafe {
    STATES
      .get()
      .unwrap()
      .iter()
      .map(|x| {
        parse_str::<Arm>(&format!(
          "State::{} => state_{}(self, current)",
          x,
          x.to_string().to_lowercase()
        ))
        .unwrap()
      })
      .collect()
  };

  TokenStream::from(quote! {
    let result = match self.state.get() {
      State::FINISH => 0,
      State::ERROR => 0,
      #(#states_arms),*,
    };

    let new_state = self.state.get();
  })
}

/// Translates a state enum variant to a string.
#[proc_macro]
pub fn c_match_state_string(_input: TokenStream) -> TokenStream {
  let states_to_string_arms: Vec<_> = unsafe {
    STATES
      .get()
      .unwrap()
      .iter()
      .map(|x| parse_str::<Arm>(&format!("State::{} => \"{}\"", x, x)).unwrap())
      .collect()
  };

  TokenStream::from(quote! {
    match self.state.get() {
      State::FINISH => "FINISH",
      State::ERROR => "ERROR",
      #(#states_to_string_arms),*
    }.into()
  })
}

/// Translates a error code enum variant to a string.
#[proc_macro]
pub fn c_match_error_code_string(_input: TokenStream) -> TokenStream {
  let error_to_string_arms: Vec<_> = unsafe {
    ERRORS
      .get()
      .unwrap()
      .iter()
      .map(|x| parse_str::<Arm>(&format!("Error::{} => \"{}\"", x, x)).unwrap())
      .collect()
  };

  TokenStream::from(quote! {
    match &self.error_code.get() {
      Error::NONE => "NONE",
      Error::UNEXPECTED_DATA => "UNEXPECTED_DATA",
      Error::UNEXPECTED_EOF => "UNEXPECTED_EOF",
      Error::CALLBACK_ERROR => "CALLBACK_ERROR",
      #(#error_to_string_arms),*
    }.into()
  })
}

// #endregion generators

/// Generates all parser constants.
#[proc_macro]
pub fn generate_constants(_input: TokenStream) -> TokenStream {
  TokenStream::from(quote! {
    pub const SUSPEND: isize = isize::MIN;

    pub const AUTODETECT: u8 = 0;
    pub const REQUEST: u8 = 1;
    pub const RESPONSE: u8 = 2;

    pub const CONNECTION_KEEPALIVE: u8 = 0;
    pub const CONNECTION_CLOSE: u8 = 1;
    pub const CONNECTION_UPGRADE: u8 = 2;
  })
}

/// Generates all parser enum and structs out of methods state, errors and
/// callbacks definitions.
#[proc_macro]
pub fn generate_enums(_input: TokenStream) -> TokenStream {
  let methods: Vec<_> = METHODS
    .get()
    .unwrap()
    .iter()
    .map(|x| format_ident!("{}", x.replace('-', "_")))
    .collect();

  let states: Vec<_> = unsafe { STATES.get().unwrap().iter().map(|x| format_ident!("{}", x)).collect() };

  let errors: Vec<_> = unsafe { ERRORS.get().unwrap().iter().map(|x| format_ident!("{}", x)).collect() };

  let methods_consts: Vec<_> = METHODS
    .get()
    .unwrap()
    .iter()
    .enumerate()
    .map(|(i, x)| parse_str::<ItemConst>(&format!("pub const METHOD_{}: u8 = {};", x.replace('-', "_"), i)).unwrap())
    .collect();

  let states_consts: Vec<_> = unsafe {
    STATES
      .get()
      .unwrap()
      .iter()
      .enumerate()
      .map(|(i, x)| parse_str::<ItemConst>(&format!("pub const STATES_{}: u8 = {};", x, i)).unwrap())
      .collect()
  };

  let errors_consts: Vec<_> = unsafe {
    ERRORS
      .get()
      .unwrap()
      .iter()
      .enumerate()
      .map(|(i, x)| parse_str::<ItemConst>(&format!("pub const ERROR_{}: u8 = {};", x, i)).unwrap())
      .collect()
  };

  TokenStream::from(quote! {
    #(#errors_consts)*

    #(#methods_consts)*

    #(#states_consts)*

    #[cfg(not(target_family = "wasm"))]
    #[no_mangle]
    pub type Callback = fn (&Parser, *const c_uchar, usize) -> isize;

    // MessageType and Connection reflects the constants in generate_constants
    // to allow easier interoperability, especially in WASM.
    #[wasm_bindgen]
    #[repr(u8)]
    #[derive(Copy, Clone, Debug)]
    pub enum MessageType {
      AUTODETECT,
      REQUEST,
      RESPONSE,
    }

    #[wasm_bindgen]
    #[repr(u8)]
    #[derive(Copy, Clone, Debug)]
    pub enum Connection {
      KEEPALIVE,
      CLOSE,
      UPGRADE,
    }

    #[wasm_bindgen]
    #[repr(u8)]
    #[derive(Copy, Clone, Debug)]
    pub enum Method {
      #(#methods),*
    }

    #[wasm_bindgen]
    #[repr(u8)]
    #[derive(Copy, Clone, Debug)]
    pub enum State {
      #(#states),*
    }

    #[wasm_bindgen]
    #[repr(u8)]
    #[derive(Copy, Clone, Debug)]
    pub enum Error {
      #(#errors),*
    }
  })
}

#[proc_macro]
pub fn generate_callbacks(_input: TokenStream) -> TokenStream {
  let callbacks: Vec<_> = unsafe {
    CALLBACKS
      .get()
      .unwrap()
      .iter()
      .map(|x| format_ident!("{}", x))
      .collect()
  };

  TokenStream::from(quote! {
    fn noop_internal(_parser: &Parser, _data: *const c_uchar, _len: usize) -> isize {
      0
    }

    #[repr(C)]
    #[derive(Clone, Debug)]
    pub struct Callbacks {
      #( pub #callbacks: Cell<Callback>),*
    }

    #[wasm_bindgen]
    impl Callbacks {
      fn new() -> Callbacks {
        Callbacks {
          #( #callbacks: Cell::new(noop_internal) ),*
        }
      }
    }
  })
}

#[proc_macro]
pub fn generate_callbacks_wasm(_input: TokenStream) -> TokenStream {
  let callbacks: Vec<_> = unsafe {
    CALLBACKS
      .get()
      .unwrap()
      .iter()
      .map(|x| format_ident!("{}", x))
      .collect()
  };

  TokenStream::from(quote! {
    #[repr(C)]
    #[derive(Clone, Debug)]
    pub struct Callbacks {
      #( pub #callbacks: Function),*
    }

    impl Callbacks {
      fn new() -> Callbacks {
        let noop = Function::new_no_args("return 0");

        Callbacks {
          #( #callbacks: noop.clone() ),*
        }
      }
    }
  })
}

#[proc_macro]
pub fn generate_callbacks_wasm_setters(_input: TokenStream) -> TokenStream {
  let snake_matcher = Regex::new(r"_([a-z])").unwrap();

  let setters: Vec<_> = unsafe {
    CALLBACKS
      .get()
      .unwrap()
      .iter()
      .map(|name| {
        let lowercase = format!("set_{}", name.to_lowercase());
        let fn_name = format_ident!("{}", lowercase);
        let cb_name = format_ident!("{}", name);
        let js_name = snake_matcher.replace_all(lowercase.as_str(), |captures: &Captures| captures[1].to_uppercase());

        quote! {
          #[wasm_bindgen(js_name=#js_name)]
          pub fn #fn_name(&mut self, cb: Function) -> Result<(), JsValue> {
            if cb.is_falsy() {
              Function::new_no_args("return 0");
              return Ok(())
            } else if !cb.is_function() {
              return Err(
                js_sys::Error::new(&format!("The callback for {} must be a function or a falsy value.", #js_name)).into()
              );
            }

            self.callbacks.#cb_name = cb;
            Ok(())
          }
        }
      })
      .collect()
  };

  TokenStream::from(quote! {
    #[wasm_bindgen]
    impl Parser {
      #(#setters)*
    }
  })
}

/// Core parser logic, it is shared amongst all the possible implementations of
/// the parsing method.
///
/// Note that this could have been achieved via #[inline(always)] and recursion,
/// but we want to make sure the compiler cannot ignore it.
#[proc_macro]
pub fn parse(_input: TokenStream) -> TokenStream {
  TokenStream::from(quote! {
    // Set the data to analyze, prepending unconsumed data from previous iteration
    // if needed
    let unconsumed_len = self.unconsumed_len.get();
    let mut current = if unconsumed_len > 0 {
      unsafe {
        limit += unconsumed_len;
        let unconsumed = from_raw_parts(self.unconsumed.get(), unconsumed_len);

        aggregate = [unconsumed, data].concat();
        &aggregate[..]
      }
    } else {
      data
    };

    // Notify initial state change when starting
    #[cfg(debug_assertions)]
    if self.position.get() == 0 {
      callback_no_return!(before_state_change);
    }

    // Limit the data that is currently analyzed
    current = &current[..limit];

    #[cfg(all(debug_assertions, feature = "milo_debug_loop"))]
    let mut last = Instant::now();

    #[cfg(all(debug_assertions, feature = "milo_debug_loop"))]
    let mut previous_state = self.state.get();

    // Until there is data or there is a request to continue
    while !current.is_empty() || self.continue_without_data.get() {
      // Reset the continue_without_data bit
      self.continue_without_data.set(false);

      // Since states might advance position manually, the parser have to explicitly
      // track it
      let initial_position = self.position.get();

      // If the parser has finished and it receives more data, error
      if let State::FINISH = self.state.get() {
        self.fail_str(Error::UNEXPECTED_DATA, "unexpected data");
        continue;
      }

      // Apply the current state
      apply_state!();

      // If the parser finished or errored, execute callbacks
      match new_state {
        State::FINISH => {
          callback_no_return!(on_finish);
        }
        State::ERROR => {
          #[cfg(not(target_family = "wasm"))]
          (self.callbacks.on_error.get())(self, self.error_description.get(), self.error_description_len.get());

          #[cfg(target_family = "wasm")]
          {
            self.callbacks.on_error.call2(
              &JsValue::NULL,
              unsafe { &Uint8Array::view(from_raw_parts(self.error_description.get(), self.error_description_len.get())) },
              &JsValue::from(self.error_description_len.get())
            ).unwrap_or(JsValue::NULL);

          }

          break;
        }
        _ => {}
      }

      // If the state suspended the parser, then bail out earlier
      if result == SUSPEND {
        break;
      }

      // Update the position of the parser
      let advance = result as usize;
      let new_position = self.position.update(|x| x + (advance as u64));

      // Compute how many bytes were actually consumed and then advance the data
      let difference = (new_position - initial_position) as usize;

      consumed += difference;
      current = &current[difference..];

      // Show the duration of the operation if asked to
      #[cfg(all(debug_assertions, feature = "milo_debug_loop"))]
      {
        let duration = Instant::now().duration_since(last).as_nanos();

        if duration > 100 {
          println!(
            "[milo::debug] loop iteration ({} -> {}) completed in {} ns",
            previous_state, self.state, duration
          );
        }

        last = Instant::now();
        previous_state = new_state;
      }

      // If a callback paused the parser, break now
      if self.paused.get() {
        break;
      }
    }

    unsafe {
      // Drop any previous retained data
      if unconsumed_len > 0 {
        Vec::from_raw_parts(self.unconsumed.get() as *mut c_uchar, unconsumed_len, unconsumed_len);

        self.unconsumed.set(ptr::null());
        self.unconsumed_len.set(0);
      }

      // If less bytes were consumed than requested, copy the unconsumed portion in
      // the parser for the next iteration
      if consumed < limit {
        let (ptr, len, _) = current.to_vec().into_raw_parts();

        self.unconsumed.set(ptr);
        self.unconsumed_len.set(len);
      }
    }
  })
}
