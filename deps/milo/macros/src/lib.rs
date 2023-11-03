mod parsing;

use std::fs::{read_to_string, File, OpenOptions};
use std::io::BufWriter;
use std::path::Path;
use std::sync::OnceLock;
use std::{collections::HashMap, ffi::c_uchar};

use indexmap::{IndexMap, IndexSet};
use parsing::{Failure, Identifiers, IdentifiersWithExpr, IdentifiersWithStatements, StringLength};
use proc_macro::TokenStream;
use quote::{format_ident, quote};
use regex::{Captures, Regex};
use semver::Version;
use serde::Serialize;
use syn::{parse_macro_input, parse_str, Arm, Expr, Ident, ItemConst, LitByte, LitChar, LitInt, LitStr, Stmt};
use toml::Table;

// Global state variables for later use
static METHODS: OnceLock<Vec<String>> = OnceLock::new();
static mut ERRORS: OnceLock<IndexSet<String>> = OnceLock::new();
static mut CALLBACKS: OnceLock<IndexSet<String>> = OnceLock::new();
static mut STATES: OnceLock<IndexSet<String>> = OnceLock::new();
static mut MIXINS: OnceLock<HashMap<String, Vec<String>>> = OnceLock::new();

#[derive(Serialize)]
struct BuildInfo {
  version: IndexMap<String, usize>,
  constants: IndexMap<String, usize>,
}

/// Takes a state name and returns its state variant, which is its uppercased
/// version.
fn format_state(ident: &Ident) -> Ident { format_ident!("STATE_{}", ident.to_string().to_uppercase()) }

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

// Export all build info to a file for the scripts to re-use it
fn save_constants() {
  let mut milo_cargo_toml_path = Path::new(file!()).parent().unwrap().to_path_buf();
  milo_cargo_toml_path.push("../../parser/Cargo.toml");

  // Get milo version
  let milo_cargo_toml = read_to_string(milo_cargo_toml_path).unwrap().parse::<Table>().unwrap();
  let milo_version = Version::parse(
    milo_cargo_toml["package"].as_table().unwrap()["version"]
      .as_str()
      .unwrap(),
  )
  .unwrap();
  let mut version: IndexMap<String, usize> = IndexMap::new();
  version.insert("major".into(), milo_version.major as usize);
  version.insert("minor".into(), milo_version.minor as usize);
  version.insert("patch".into(), milo_version.patch as usize);

  // Serialize constants
  let mut consts: IndexMap<String, usize> = IndexMap::new();
  consts.insert("AUTODETECT".into(), 0);
  consts.insert("REQUEST".into(), 1);
  consts.insert("RESPONSE".into(), 2);
  consts.insert("CONNECTION_KEEPALIVE".into(), 0);
  consts.insert("CONNECTION_CLOSE".into(), 1);
  consts.insert("CONNECTION_UPGRADE".into(), 2);

  for (i, x) in METHODS.get().unwrap().iter().enumerate() {
    consts.insert(format!("METHOD_{}", x.replace('-', "_")), i);
  }

  for (i, x) in unsafe { ERRORS.get().unwrap() }.iter().enumerate() {
    consts.insert(format!("ERROR_{}", x), i);
  }

  for (i, x) in unsafe { STATES.get().unwrap() }.iter().enumerate() {
    consts.insert(format!("STATE_{}", x), i);
  }

  // Prepare the data to save
  let data = BuildInfo {
    version,
    constants: consts,
  };

  // Write information in the file
  let mut json_path = Path::new(file!()).parent().unwrap().to_path_buf();
  json_path.push("../../parser/target/buildinfo.json");

  let file = OpenOptions::new()
    .write(true)
    .create(true)
    .truncate(true)
    .open(json_path.as_path());

  let writer = BufWriter::new(file.unwrap());
  serde_json::to_writer_pretty(writer, &data).unwrap();
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
      TokenStream::from(quote! { parser.move_to(#state, (#expr) as isize) })
    } else {
      TokenStream::from(quote! { parser.move_to(#state, 1) })
    }
  }

  #[cfg(not(debug_assertions))]
  {
    if let Some(expr) = definition.expr {
      TokenStream::from(quote! {
        {
          parser.state.set(#state);
          (#expr) as isize
        }
      })
    } else {
      TokenStream::from(quote! {
        {
          parser.state.set(#state);
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
  let error = format_ident!("ERROR_{}", definition.error);
  let message = definition.message;

  if let Expr::Lit(_) = message {
    TokenStream::from(quote! { parser.fail_str(#error, #message) })
  } else {
    TokenStream::from(quote! { parser.fail(#error, #message) })
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
  let definition = parse_macro_input!(input as Ident);
  let ident = definition.to_string();
  let name = ident.as_str();

  let table = match name {
    "digit" => {
      quote! {
        let table = digit_table.get_or_init(|| {
          let mut table = [false; 256];

          for i in 0x30..=0x39 {
            table[i] = true;
          }

          table
        });
      }
    }
    "hex_digit" => {
      quote! {
        let table = hex_digit_table.get_or_init(|| {
          let mut table = [false; 256];

          for i in 0x30..=0x39 {
            table[i] = true;
          }

          for i in 0x41..=0x46 {
            table[i] = true;
          }

          for i in 0x61..=0x66 {
            table[i] = true;
          }

          table
        });
      }
    }
    "token" => {
      quote! {
        let table = token_table.get_or_init(|| {
          let mut table = [false; 256];

          for i in 0..=255 {
            if let token!() = i {
              table[i as usize] = true;
            }
          }

          table
        });
      }
    }
    "token_value" => {
      quote! {
        let table = token_value_table.get_or_init(|| {
          let mut table = [false; 256];
          table[9] = true;
          table[32] = true;

          for i in 0x21..=0xff {
            if i != 0x7f {
              table[i] = true;
            }
          }

          table
        });
      }
    }
    "token_value_quoted" => {
      quote! {
        let table = token_value_quote_table.get_or_init(|| {
          let mut table = [false; 256];
          table[9] = true;
          table[32] = true;

          for i in 0x21..=0x7e {
            table[i] = true;
          }

          table
        });
      }
    }
    "url" => {
      quote! {
        let table = url_table.get_or_init(|| {
          let mut table = [false; 256];

          for i in 0..=255 {
            if let url!() = i {
              table[i as usize] = true;
            }
          }

          table
        });
      }
    }
    "ws" => {
      quote! {
        let table = ws_table.get_or_init(|| {
          let mut table = [false; 256];
          table[9] = true;
          table[32] = true;

          table
        });
      }
    }
    _ => panic!("Unsupported consumed type {}", name),
  };

  TokenStream::from(quote! {
    #table

    let max = data.len();
    let mut consumed = data.iter().position(|x| !table[*x as usize]).unwrap_or(max);

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

  // TODO@PI: Check what happens when it returns undefined
  let validate_wasm = if return_on_error {
    quote! {
      if let Err(err) = ret {
        return #parser.fail(ERROR_CALLBACK_ERROR, format!("The callback for {} has failed: {}.", #callback_name, err.as_string().unwrap()));
      }

      let value = ret.unwrap().as_f64();

      if let None = value {
        return #parser.fail(ERROR_CALLBACK_ERROR, format!("The callback for {} must return a number.", #callback_name));
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
              #parser.fail(ERROR_CALLBACK_ERROR, format!("The callback for {} must return a number.", #callback_name));
              0 as isize
            }
          }
        }
        Err(err) => {
          #parser.fail(ERROR_CALLBACK_ERROR, format!("The callback for {} has failed: {}.", #callback_name, err.as_string().unwrap()));
          0 as isize
        }
      }
    }
  };

  let (invocation, invocation_wasm) = if let Some(length) = definition.expr {
    (
      quote! {
        {
          #[cfg(not(feature = "no-copy"))]
          {
            (#parser.callbacks.#callback.get())(#parser, data.as_ptr(), (#length) as usize)
          }

          #[cfg(feature = "no-copy")]
          {
            (#parser.callbacks.#callback.get())(#parser, #parser.position.get() as usize, (#length) as usize)
          }
        }
      },
      quote! {
        {
          // TODO@PI: Handle when the return value is not an integer

          #[cfg(not(feature = "no-copy"))]
          let ret = #parser.callbacks.#callback.call2(&JsValue::NULL, unsafe { &Uint8Array::view(data) }, &JsValue::from(#length));

          #[cfg(feature = "no-copy")]
          let ret = #parser.callbacks.#callback.call2(&JsValue::NULL, &JsValue::from(#parser.position.get() as usize), &JsValue::from(#length));

          #validate_wasm
        }
      },
    )
  } else {
    (
      quote! {
        {
          #[cfg(not(feature = "no-copy"))]
          {
            (#parser.callbacks.#callback.get())(#parser, ptr::null(), 0)
          }

          #[cfg(feature = "no-copy")]
          {
            (#parser.callbacks.#callback.get())(#parser, 0, 0)
          }
        }
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
        ERROR_CALLBACK_ERROR,
        format!("Callback {} failed with return value {}.", #callback_name, invocation_result),
      );
    }
  } else {
    quote! {
      #parser.fail(
        ERROR_CALLBACK_ERROR,
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
/// Generates all states for quick resolving.
#[proc_macro]
pub fn initialize_states_table(_input: TokenStream) -> TokenStream {
  let states_assignment: Vec<_> = unsafe { STATES.get().unwrap() }
    .iter()
    .map(|x| format_ident!("state_{}", x.to_lowercase()))
    .collect();

  TokenStream::from(quote! {
    states_handlers.get_or_init(|| {
      [
        #(#states_assignment),*
      ]
    });
  })
}

/// Generates all parser constants.
#[proc_macro]
pub fn generate_constants(_input: TokenStream) -> TokenStream {
  save_constants();

  let methods_consts: Vec<_> = METHODS
    .get()
    .unwrap()
    .iter()
    .enumerate()
    .map(|(i, x)| parse_str::<ItemConst>(&format!("pub const METHOD_{}: u8 = {};", x.replace('-', "_"), i)).unwrap())
    .collect();

  let errors_consts: Vec<_> = unsafe {
    ERRORS
      .get()
      .unwrap()
      .iter()
      .enumerate()
      .map(|(i, x)| parse_str::<ItemConst>(&format!("pub const ERROR_{}: u8 = {};", x, i)).unwrap())
      .collect()
  };

  let states_ref = unsafe { STATES.get().unwrap() };

  let states_consts: Vec<_> = states_ref
    .iter()
    .enumerate()
    .map(|(i, x)| parse_str::<ItemConst>(&format!("pub const STATE_{}: u8 = {};", x, i)).unwrap())
    .collect();

  let states_len = states_ref.len();

  TokenStream::from(quote! {
    type StateHandler = fn (parser: &Parser, data: &[c_uchar]) -> isize;

    #[cfg(not(target_family = "wasm"))]
    #[no_mangle]

    #[cfg(not(feature = "no-copy"))]
    pub type Callback = fn (&Parser, *const c_uchar, usize) -> isize;

    #[cfg(feature = "no-copy")]
    pub type Callback = fn (&Parser, usize, usize) -> isize;

    pub const SUSPEND: isize = isize::MIN;

    pub const DEBUG: bool = cfg!(debug_assertions);
    pub const NO_COPY: bool = cfg!(feature = "no-copy");

    pub const AUTODETECT: u8 = 0;
    pub const REQUEST: u8 = 1;
    pub const RESPONSE: u8 = 2;

    pub const CONNECTION_KEEPALIVE: u8 = 0;
    pub const CONNECTION_CLOSE: u8 = 1;
    pub const CONNECTION_UPGRADE: u8 = 2;

    #(#errors_consts)*

    #(#methods_consts)*

    #(#states_consts)*

    static digit_table: OnceLock<[bool; 256]> = OnceLock::new();
    static hex_digit_table: OnceLock<[bool; 256]> = OnceLock::new();
    static token_table: OnceLock<[bool; 256]> = OnceLock::new();
    static token_value_table: OnceLock<[bool; 256]> = OnceLock::new();
    static token_value_quote_table: OnceLock<[bool; 256]> = OnceLock::new();
    static url_table: OnceLock<[bool; 256]> = OnceLock::new();
    static ws_table: OnceLock<[bool; 256]> = OnceLock::new();
    static states_handlers: OnceLock<[StateHandler; #states_len]> = OnceLock::new();
  })
}

/// Generates all parser enums.
#[proc_macro]
pub fn generate_enums(_input: TokenStream) -> TokenStream {
  let methods_ref = METHODS.get().unwrap();
  let states_ref = unsafe { STATES.get().unwrap() };
  let errors_ref = unsafe { ERRORS.get().unwrap() };

  let methods: Vec<_> = methods_ref
    .iter()
    .map(|x| format_ident!("{}", x.replace('-', "_")))
    .collect();

  let states: Vec<_> = states_ref.iter().map(|x| format_ident!("{}", x)).collect();

  let errors: Vec<_> = errors_ref.iter().map(|x| format_ident!("{}", x)).collect();

  let methods_from: Vec<_> = methods_ref
    .iter()
    .enumerate()
    .map(|(x, i)| parse_str::<Arm>(&format!("{} => Ok(Methods::{})", x, i.replace('-', "_"))).unwrap())
    .collect();

  let states_from: Vec<_> = states_ref
    .iter()
    .enumerate()
    .map(|(x, i)| parse_str::<Arm>(&format!("{} => Ok(States::{})", x, i)).unwrap())
    .collect();

  let errors_from: Vec<_> = errors_ref
    .iter()
    .enumerate()
    .map(|(x, i)| parse_str::<Arm>(&format!("{} => Ok(Errors::{})", x, i)).unwrap())
    .collect();

  let methods_into: Vec<_> = methods_ref
    .iter()
    .map(|x| parse_str::<Arm>(&format!("Methods::{} => String::from(\"{}\")", x.replace('-', "_"), x)).unwrap())
    .collect();

  let states_into: Vec<_> = states_ref
    .iter()
    .map(|x| parse_str::<Arm>(&format!("States::{} => String::from(\"{}\")", x, x)).unwrap())
    .collect();

  let errors_into: Vec<_> = errors_ref
    .iter()
    .map(|x| parse_str::<Arm>(&format!("Errors::{} => String::from(\"{}\")", x, x)).unwrap())
    .collect();

  TokenStream::from(quote! {
    // MessageType and Connection reflects the constants in generate_constants
    // to allow easier interoperability, especially in WASM.
    #[wasm_bindgen]
    #[repr(u8)]
    #[derive(Copy, Clone, Debug)]
    pub enum MessageTypes {
      AUTODETECT,
      REQUEST,
      RESPONSE,
    }

    #[wasm_bindgen]
    #[repr(u8)]
    #[derive(Copy, Clone, Debug)]
    pub enum Connections {
      KEEPALIVE,
      CLOSE,
      UPGRADE,
    }

    #[wasm_bindgen]
    #[repr(u8)]
    #[derive(Copy, Clone, Debug)]
    pub enum Methods {
      #(#methods),*
    }

    #[wasm_bindgen]
    #[repr(u8)]
    #[derive(Copy, Clone, Debug)]
    pub enum States {
      #(#states),*
    }

    #[wasm_bindgen]
    #[repr(u8)]
    #[derive(Copy, Clone, Debug)]
    pub enum Errors {
      #(#errors),*
    }

    impl TryFrom<u8> for MessageTypes {
      type Error = ();

      fn try_from(value: u8) -> Result<Self, ()> {
        match value {
          0 => Ok(MessageTypes::AUTODETECT),
          1 => Ok(MessageTypes::REQUEST),
          2 => Ok(MessageTypes::RESPONSE),
          _ => Err(())
        }
      }
    }

    impl TryFrom<u8> for Connections {
      type Error = ();

      fn try_from(value: u8) -> Result<Self, ()> {
        match value {
          0 => Ok(Connections::KEEPALIVE),
          1 => Ok(Connections::CLOSE),
          2 => Ok(Connections::UPGRADE),
          _ => Err(())
        }
      }
    }

    impl TryFrom<u8> for Methods {
      type Error = ();

      fn try_from(value: u8) -> Result<Self, ()> {
        match value {
          #(#methods_from),*,
          _ => Err(())
        }
      }
    }

    impl TryFrom<u8> for States {
      type Error = ();

      fn try_from(value: u8) -> Result<Self, ()> {
        match value {
          #(#states_from),*,
          _ => Err(())
        }
      }
    }

    impl TryFrom<u8> for Errors {
      type Error = ();

      fn try_from(value: u8) -> Result<Self, ()> {
        match value {
          #(#errors_from),*,
          _ => Err(())
        }
      }
    }

    impl Into<String> for MessageTypes {
      fn into(self) -> String {
        match self {
          MessageTypes::AUTODETECT => String::from("AUTODETECT"),
          MessageTypes::REQUEST => String::from("REQUEST"),
          MessageTypes::RESPONSE => String::from("RESPONSE")
        }
      }
    }

    impl Into<String> for Connections {
      fn into(self) -> String {
        match self {
          Connections::KEEPALIVE => String::from("KEEPALIVE"),
          Connections::CLOSE => String::from("CLOSE"),
          Connections::UPGRADE => String::from("UPGRADE")
        }
      }
    }

    impl Into<String> for Methods {
      fn into(self) -> String {
        match self {
          #(#methods_into),*
        }
      }
    }

    impl Into<String> for States {
      fn into(self) -> String {
        match self {
          #(#states_into),*
        }
      }
    }

    impl Into<String> for Errors {
      fn into(self) -> String {
        match self {
          #(#errors_into),*
        }
      }
    }

    impl MessageTypes {
      pub fn as_string(self) -> String {
        self.into()
      }
    }

    impl Connections {
      pub fn as_string(self) -> String {
        self.into()
      }
    }

    impl Methods {
      pub fn as_string(self) -> String {
        self.into()
      }
    }

    impl States {
      pub fn as_string(self) -> String {
        self.into()
      }
    }

    impl Errors {
      pub fn as_string(self) -> String {
        self.into()
      }
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
    #[cfg(not(feature = "no-copy"))]
    fn noop_internal(_parser: &Parser, _data: *const c_uchar, _len: usize) -> isize {
      0
    }

    #[cfg(feature = "no-copy")]
    fn noop_internal(_parser: &Parser, _data: usize, _len: usize) -> isize {
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

    let mut consumed = 0;
    let mut current: &[u8];

    #[cfg(not(feature = "no-copy"))]
    let mut limit = limit;

    #[cfg(not(feature = "no-copy"))]
    let aggregate: Vec<c_uchar>;

    #[cfg(not(feature = "no-copy"))]
    let unconsumed_len = self.unconsumed_len.get();

    #[cfg(not(feature = "no-copy"))]
    {
      current = if unconsumed_len > 0 {
        unsafe {
          limit += unconsumed_len;
          let unconsumed = from_raw_parts(self.unconsumed.get(), unconsumed_len);

          aggregate = [unconsumed, data].concat();
          &aggregate[..]
        }
      } else {
        data
      };
    }

    #[cfg(feature = "no-copy")]
    let mut current = data;

    // Limit the data that is currently analyzed
    current = &current[..limit];

    #[cfg(all(debug_assertions, feature = "debug"))]
    let mut last = Instant::now();

    #[cfg(all(debug_assertions, feature = "debug"))]
    let start = Instant::now();

    #[cfg(all(debug_assertions, feature = "debug"))]
    let mut previous_state = self.state.get();

    let handlers = states_handlers.get().unwrap();

    // Since states might advance position manually, the parser have to explicitly track it
    let mut initial_position = self.position.update(|_| 0);

    // Until there is data or there is a request to continue
    while !current.is_empty() || self.continue_without_data.get() {
      // Reset the continue_without_data bit
      self.continue_without_data.set(false);

      // If the parser has finished and it receives more data, error
      if self.state.get() == STATE_FINISH {
        self.fail_str(ERROR_UNEXPECTED_DATA, "unexpected data");
        continue;
      }

      // Apply the current state
      let result = (handlers[self.state.get() as usize])(self, current);
      let new_state = self.state.get();

      // If the parser finished or errored, execute callbacks
      if new_state == STATE_FINISH {
        callback_no_return!(on_finish);
      } else if new_state == STATE_ERROR {
        callback_no_return!(on_error);
        break;
      } else if result == SUSPEND {
        // If the state suspended the parser, then bail out earlier
        break;
      }

      // Update the position of the parser
      let new_position = self.position.update(|x| x + (result as u64));

      // Compute how many bytes were actually consumed and then advance the data
      let difference = (new_position - initial_position) as usize;

      consumed += difference;
      current = &current[difference..];
      initial_position = new_position;

      // Show the duration of the operation if asked to
      #[cfg(all(debug_assertions, feature = "debug"))]
      {
        let duration = Instant::now().duration_since(last).as_nanos();

        if duration > 0 {
          println!(
            "[milo::debug] loop iteration ({:?} -> {:?}) completed in {} ns",
            previous_state, self.state.get(), duration
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

    self.parsed.update(|x| x + (consumed as u64));

    #[cfg(not(feature = "no-copy"))]
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

    #[cfg(all(debug_assertions, feature = "debug"))]
    {
      let duration = Instant::now().duration_since(start).as_nanos();

      if duration > 0 {
        println!(
          "[milo::debug] parse ({:?}, consumed {} of {}) completed in {} ns", self.state.get(), consumed, limit, duration
        );
      }
    }
  })
}
// #endregion generators
