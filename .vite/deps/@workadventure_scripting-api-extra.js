// node_modules/@workadventure/scripting-api-extra/dist/Properties.js
var Properties = class {
  constructor(properties) {
    this.properties = properties !== null && properties !== void 0 ? properties : [];
  }
  get(name) {
    const values = this.properties.filter((property) => property.name === name).map((property) => property.value);
    if (values.length > 1) {
      throw new Error('Expected only one property to be named "' + name + '"');
    }
    if (values.length === 0) {
      return void 0;
    }
    return values[0];
  }
  getString(name) {
    return this.getByType(name, "string");
  }
  getNumber(name) {
    return this.getByType(name, "number");
  }
  getBoolean(name) {
    return this.getByType(name, "boolean");
  }
  getByType(name, type) {
    const value = this.get(name);
    if (value === void 0) {
      return void 0;
    }
    if (type !== "json" && typeof value !== type) {
      throw new Error('Expected property "' + name + '" to have type "' + type + '"');
    }
    return value;
  }
  mustGetString(name) {
    return this.mustGetByType(name, "string");
  }
  mustGetNumber(name) {
    return this.mustGetByType(name, "number");
  }
  mustGetBoolean(name) {
    return this.mustGetByType(name, "boolean");
  }
  mustGetByType(name, type) {
    const value = this.get(name);
    if (value === void 0) {
      throw new Error('Property "' + name + '" is missing');
    }
    if (type !== "json" && typeof value !== type) {
      throw new Error('Expected property "' + name + '" to have type "' + type + '"');
    }
    return value;
  }
  getType(name) {
    const types = this.properties.filter((property) => property.name === name).map((property) => property.type);
    if (types.length > 1) {
      throw new Error('Expected only one property to be named "' + name + '"');
    }
    if (types.length === 0) {
      return void 0;
    }
    return types[0];
  }
};

// node_modules/@workadventure/scripting-api-extra/dist/Features/default_assets_url.js
var defaultAssetsUrl = "https://unpkg.com/@workadventure/scripting-api-extra@1.4.6/dist";

// node_modules/@workadventure/scripting-api-extra/dist/VariablesExtra.js
var VariableDescriptor = class {
  constructor(object) {
    this.name = object.name;
    this.x = object.x;
    this.y = object.y;
    this.properties = new Properties(object.properties);
  }
  get isReadable() {
    const readableBy = this.properties.getString("readableBy");
    if (!readableBy) {
      return true;
    }
    return WA.player.tags.includes(readableBy);
  }
  get isWritable() {
    const writableBy = this.properties.getString("writableBy");
    if (!writableBy) {
      return true;
    }
    return WA.player.tags.includes(writableBy);
  }
};
function openConfig(variables) {
  const parameters = variables ? "#" + variables.join() : "";
  WA.nav.openCoWebSite(defaultAssetsUrl + "/configuration.html" + parameters);
}
async function getVariables(layerFilter, variablesFilter) {
  const map = await WA.room.getTiledMap();
  const variables = /* @__PURE__ */ new Map();
  getAllVariablesRecursive(map.layers, variables, layerFilter, variablesFilter);
  return variables;
}
function getAllVariablesRecursive(layers, variables, layerFilter, variablesFilter) {
  for (const layer of layers) {
    if (layer.type === "objectgroup") {
      for (const object of layer.objects) {
        if (object.type === "variable" || object.class === "variable") {
          if (!!layerFilter && layer.name !== layerFilter)
            continue;
          if (!!variablesFilter && !variablesFilter.includes(object.name))
            continue;
          variables.set(object.name, new VariableDescriptor(object));
        }
      }
    } else if (layer.type === "group") {
      getAllVariablesRecursive(layer.layers, variables, layerFilter, variablesFilter);
    }
  }
}

// node_modules/@workadventure/scripting-api-extra/dist/LayersFlattener.js
var layersMapPromise = void 0;
async function getLayersMap() {
  if (layersMapPromise === void 0) {
    layersMapPromise = getLayersMapWithoutCache();
  }
  return layersMapPromise;
}
async function getLayersMapWithoutCache() {
  return flattenGroupLayersMap(await WA.room.getTiledMap());
}
function flattenGroupLayersMap(map) {
  const flatLayers = /* @__PURE__ */ new Map();
  flattenGroupLayers(map.layers, "", flatLayers);
  return flatLayers;
}
function flattenGroupLayers(layers, prefix, flatLayers) {
  for (const layer of layers) {
    if (layer.type === "group") {
      flattenGroupLayers(layer.layers, prefix + layer.name + "/", flatLayers);
    } else {
      layer.name = prefix + layer.name;
      flatLayers.set(layer.name, layer);
    }
  }
}

// node_modules/@workadventure/scripting-api-extra/dist/AreaObject.js
async function getAreaObject() {
  const layers = await getLayersMap();
  const areaArray = [];
  for (const layer of layers.values()) {
    if (layer.type === "objectgroup") {
      for (const object of layer.objects) {
        if (object.type === "area" || object.class === "area") {
          areaArray.push(object);
        }
      }
    }
  }
  return areaArray;
}

// node_modules/@workadventure/scripting-api-extra/dist/LayersExtra.js
function findLayerBoundaries(layer) {
  let left = Infinity;
  let top = Infinity;
  let bottom = 0;
  let right = 0;
  const data = layer.data;
  if (typeof data === "string") {
    throw new Error("Unsupported tile layer data stored as string instead of CSV");
  }
  for (let j = 0; j < layer.height; j++) {
    for (let i = 0; i < layer.width; i++) {
      if (data[i + j * layer.width] !== 0) {
        left = Math.min(left, i);
        right = Math.max(right, i);
        top = Math.min(top, j);
        bottom = Math.max(bottom, j);
      }
    }
  }
  return {
    top,
    left,
    right: right + 1,
    bottom: bottom + 1
  };
}
function findLayersBoundaries(layers) {
  let left = Infinity;
  let top = Infinity;
  let bottom = 0;
  let right = 0;
  for (const layer of layers) {
    const boundaries = findLayerBoundaries(layer);
    if (boundaries.left < left) {
      left = boundaries.left;
    }
    if (boundaries.top < top) {
      top = boundaries.top;
    }
    if (boundaries.right > right) {
      right = boundaries.right;
    }
    if (boundaries.bottom > bottom) {
      bottom = boundaries.bottom;
    }
  }
  return {
    top,
    left,
    right,
    bottom
  };
}

// node_modules/mustache/mustache.mjs
var objectToString = Object.prototype.toString;
var isArray = Array.isArray || function isArrayPolyfill(object) {
  return objectToString.call(object) === "[object Array]";
};
function isFunction(object) {
  return typeof object === "function";
}
function typeStr(obj) {
  return isArray(obj) ? "array" : typeof obj;
}
function escapeRegExp(string) {
  return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
}
function hasProperty(obj, propName) {
  return obj != null && typeof obj === "object" && propName in obj;
}
function primitiveHasOwnProperty(primitive, propName) {
  return primitive != null && typeof primitive !== "object" && primitive.hasOwnProperty && primitive.hasOwnProperty(propName);
}
var regExpTest = RegExp.prototype.test;
function testRegExp(re, string) {
  return regExpTest.call(re, string);
}
var nonSpaceRe = /\S/;
function isWhitespace(string) {
  return !testRegExp(nonSpaceRe, string);
}
var entityMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;"
};
function escapeHtml(string) {
  return String(string).replace(/[&<>"'`=\/]/g, function fromEntityMap(s) {
    return entityMap[s];
  });
}
var whiteRe = /\s*/;
var spaceRe = /\s+/;
var equalsRe = /\s*=/;
var curlyRe = /\s*\}/;
var tagRe = /#|\^|\/|>|\{|&|=|!/;
function parseTemplate(template, tags) {
  if (!template)
    return [];
  var lineHasNonSpace = false;
  var sections = [];
  var tokens = [];
  var spaces = [];
  var hasTag = false;
  var nonSpace = false;
  var indentation = "";
  var tagIndex = 0;
  function stripSpace() {
    if (hasTag && !nonSpace) {
      while (spaces.length)
        delete tokens[spaces.pop()];
    } else {
      spaces = [];
    }
    hasTag = false;
    nonSpace = false;
  }
  var openingTagRe, closingTagRe, closingCurlyRe;
  function compileTags(tagsToCompile) {
    if (typeof tagsToCompile === "string")
      tagsToCompile = tagsToCompile.split(spaceRe, 2);
    if (!isArray(tagsToCompile) || tagsToCompile.length !== 2)
      throw new Error("Invalid tags: " + tagsToCompile);
    openingTagRe = new RegExp(escapeRegExp(tagsToCompile[0]) + "\\s*");
    closingTagRe = new RegExp("\\s*" + escapeRegExp(tagsToCompile[1]));
    closingCurlyRe = new RegExp("\\s*" + escapeRegExp("}" + tagsToCompile[1]));
  }
  compileTags(tags || mustache.tags);
  var scanner = new Scanner(template);
  var start, type, value, chr, token, openSection;
  while (!scanner.eos()) {
    start = scanner.pos;
    value = scanner.scanUntil(openingTagRe);
    if (value) {
      for (var i = 0, valueLength = value.length; i < valueLength; ++i) {
        chr = value.charAt(i);
        if (isWhitespace(chr)) {
          spaces.push(tokens.length);
          indentation += chr;
        } else {
          nonSpace = true;
          lineHasNonSpace = true;
          indentation += " ";
        }
        tokens.push(["text", chr, start, start + 1]);
        start += 1;
        if (chr === "\n") {
          stripSpace();
          indentation = "";
          tagIndex = 0;
          lineHasNonSpace = false;
        }
      }
    }
    if (!scanner.scan(openingTagRe))
      break;
    hasTag = true;
    type = scanner.scan(tagRe) || "name";
    scanner.scan(whiteRe);
    if (type === "=") {
      value = scanner.scanUntil(equalsRe);
      scanner.scan(equalsRe);
      scanner.scanUntil(closingTagRe);
    } else if (type === "{") {
      value = scanner.scanUntil(closingCurlyRe);
      scanner.scan(curlyRe);
      scanner.scanUntil(closingTagRe);
      type = "&";
    } else {
      value = scanner.scanUntil(closingTagRe);
    }
    if (!scanner.scan(closingTagRe))
      throw new Error("Unclosed tag at " + scanner.pos);
    if (type == ">") {
      token = [type, value, start, scanner.pos, indentation, tagIndex, lineHasNonSpace];
    } else {
      token = [type, value, start, scanner.pos];
    }
    tagIndex++;
    tokens.push(token);
    if (type === "#" || type === "^") {
      sections.push(token);
    } else if (type === "/") {
      openSection = sections.pop();
      if (!openSection)
        throw new Error('Unopened section "' + value + '" at ' + start);
      if (openSection[1] !== value)
        throw new Error('Unclosed section "' + openSection[1] + '" at ' + start);
    } else if (type === "name" || type === "{" || type === "&") {
      nonSpace = true;
    } else if (type === "=") {
      compileTags(value);
    }
  }
  stripSpace();
  openSection = sections.pop();
  if (openSection)
    throw new Error('Unclosed section "' + openSection[1] + '" at ' + scanner.pos);
  return nestTokens(squashTokens(tokens));
}
function squashTokens(tokens) {
  var squashedTokens = [];
  var token, lastToken;
  for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
    token = tokens[i];
    if (token) {
      if (token[0] === "text" && lastToken && lastToken[0] === "text") {
        lastToken[1] += token[1];
        lastToken[3] = token[3];
      } else {
        squashedTokens.push(token);
        lastToken = token;
      }
    }
  }
  return squashedTokens;
}
function nestTokens(tokens) {
  var nestedTokens = [];
  var collector = nestedTokens;
  var sections = [];
  var token, section;
  for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
    token = tokens[i];
    switch (token[0]) {
      case "#":
      case "^":
        collector.push(token);
        sections.push(token);
        collector = token[4] = [];
        break;
      case "/":
        section = sections.pop();
        section[5] = token[2];
        collector = sections.length > 0 ? sections[sections.length - 1][4] : nestedTokens;
        break;
      default:
        collector.push(token);
    }
  }
  return nestedTokens;
}
function Scanner(string) {
  this.string = string;
  this.tail = string;
  this.pos = 0;
}
Scanner.prototype.eos = function eos() {
  return this.tail === "";
};
Scanner.prototype.scan = function scan(re) {
  var match = this.tail.match(re);
  if (!match || match.index !== 0)
    return "";
  var string = match[0];
  this.tail = this.tail.substring(string.length);
  this.pos += string.length;
  return string;
};
Scanner.prototype.scanUntil = function scanUntil(re) {
  var index = this.tail.search(re), match;
  switch (index) {
    case -1:
      match = this.tail;
      this.tail = "";
      break;
    case 0:
      match = "";
      break;
    default:
      match = this.tail.substring(0, index);
      this.tail = this.tail.substring(index);
  }
  this.pos += match.length;
  return match;
};
function Context(view, parentContext) {
  this.view = view;
  this.cache = { ".": this.view };
  this.parent = parentContext;
}
Context.prototype.push = function push(view) {
  return new Context(view, this);
};
Context.prototype.lookup = function lookup(name) {
  var cache = this.cache;
  var value;
  if (cache.hasOwnProperty(name)) {
    value = cache[name];
  } else {
    var context = this, intermediateValue, names, index, lookupHit = false;
    while (context) {
      if (name.indexOf(".") > 0) {
        intermediateValue = context.view;
        names = name.split(".");
        index = 0;
        while (intermediateValue != null && index < names.length) {
          if (index === names.length - 1)
            lookupHit = hasProperty(intermediateValue, names[index]) || primitiveHasOwnProperty(intermediateValue, names[index]);
          intermediateValue = intermediateValue[names[index++]];
        }
      } else {
        intermediateValue = context.view[name];
        lookupHit = hasProperty(context.view, name);
      }
      if (lookupHit) {
        value = intermediateValue;
        break;
      }
      context = context.parent;
    }
    cache[name] = value;
  }
  if (isFunction(value))
    value = value.call(this.view);
  return value;
};
function Writer() {
  this.templateCache = {
    _cache: {},
    set: function set(key, value) {
      this._cache[key] = value;
    },
    get: function get(key) {
      return this._cache[key];
    },
    clear: function clear() {
      this._cache = {};
    }
  };
}
Writer.prototype.clearCache = function clearCache() {
  if (typeof this.templateCache !== "undefined") {
    this.templateCache.clear();
  }
};
Writer.prototype.parse = function parse(template, tags) {
  var cache = this.templateCache;
  var cacheKey = template + ":" + (tags || mustache.tags).join(":");
  var isCacheEnabled = typeof cache !== "undefined";
  var tokens = isCacheEnabled ? cache.get(cacheKey) : void 0;
  if (tokens == void 0) {
    tokens = parseTemplate(template, tags);
    isCacheEnabled && cache.set(cacheKey, tokens);
  }
  return tokens;
};
Writer.prototype.render = function render(template, view, partials, config) {
  var tags = this.getConfigTags(config);
  var tokens = this.parse(template, tags);
  var context = view instanceof Context ? view : new Context(view, void 0);
  return this.renderTokens(tokens, context, partials, template, config);
};
Writer.prototype.renderTokens = function renderTokens(tokens, context, partials, originalTemplate, config) {
  var buffer = "";
  var token, symbol, value;
  for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
    value = void 0;
    token = tokens[i];
    symbol = token[0];
    if (symbol === "#")
      value = this.renderSection(token, context, partials, originalTemplate, config);
    else if (symbol === "^")
      value = this.renderInverted(token, context, partials, originalTemplate, config);
    else if (symbol === ">")
      value = this.renderPartial(token, context, partials, config);
    else if (symbol === "&")
      value = this.unescapedValue(token, context);
    else if (symbol === "name")
      value = this.escapedValue(token, context, config);
    else if (symbol === "text")
      value = this.rawValue(token);
    if (value !== void 0)
      buffer += value;
  }
  return buffer;
};
Writer.prototype.renderSection = function renderSection(token, context, partials, originalTemplate, config) {
  var self = this;
  var buffer = "";
  var value = context.lookup(token[1]);
  function subRender(template) {
    return self.render(template, context, partials, config);
  }
  if (!value)
    return;
  if (isArray(value)) {
    for (var j = 0, valueLength = value.length; j < valueLength; ++j) {
      buffer += this.renderTokens(token[4], context.push(value[j]), partials, originalTemplate, config);
    }
  } else if (typeof value === "object" || typeof value === "string" || typeof value === "number") {
    buffer += this.renderTokens(token[4], context.push(value), partials, originalTemplate, config);
  } else if (isFunction(value)) {
    if (typeof originalTemplate !== "string")
      throw new Error("Cannot use higher-order sections without the original template");
    value = value.call(context.view, originalTemplate.slice(token[3], token[5]), subRender);
    if (value != null)
      buffer += value;
  } else {
    buffer += this.renderTokens(token[4], context, partials, originalTemplate, config);
  }
  return buffer;
};
Writer.prototype.renderInverted = function renderInverted(token, context, partials, originalTemplate, config) {
  var value = context.lookup(token[1]);
  if (!value || isArray(value) && value.length === 0)
    return this.renderTokens(token[4], context, partials, originalTemplate, config);
};
Writer.prototype.indentPartial = function indentPartial(partial, indentation, lineHasNonSpace) {
  var filteredIndentation = indentation.replace(/[^ \t]/g, "");
  var partialByNl = partial.split("\n");
  for (var i = 0; i < partialByNl.length; i++) {
    if (partialByNl[i].length && (i > 0 || !lineHasNonSpace)) {
      partialByNl[i] = filteredIndentation + partialByNl[i];
    }
  }
  return partialByNl.join("\n");
};
Writer.prototype.renderPartial = function renderPartial(token, context, partials, config) {
  if (!partials)
    return;
  var tags = this.getConfigTags(config);
  var value = isFunction(partials) ? partials(token[1]) : partials[token[1]];
  if (value != null) {
    var lineHasNonSpace = token[6];
    var tagIndex = token[5];
    var indentation = token[4];
    var indentedValue = value;
    if (tagIndex == 0 && indentation) {
      indentedValue = this.indentPartial(value, indentation, lineHasNonSpace);
    }
    var tokens = this.parse(indentedValue, tags);
    return this.renderTokens(tokens, context, partials, indentedValue, config);
  }
};
Writer.prototype.unescapedValue = function unescapedValue(token, context) {
  var value = context.lookup(token[1]);
  if (value != null)
    return value;
};
Writer.prototype.escapedValue = function escapedValue(token, context, config) {
  var escape = this.getConfigEscape(config) || mustache.escape;
  var value = context.lookup(token[1]);
  if (value != null)
    return typeof value === "number" && escape === mustache.escape ? String(value) : escape(value);
};
Writer.prototype.rawValue = function rawValue(token) {
  return token[1];
};
Writer.prototype.getConfigTags = function getConfigTags(config) {
  if (isArray(config)) {
    return config;
  } else if (config && typeof config === "object") {
    return config.tags;
  } else {
    return void 0;
  }
};
Writer.prototype.getConfigEscape = function getConfigEscape(config) {
  if (config && typeof config === "object" && !isArray(config)) {
    return config.escape;
  } else {
    return void 0;
  }
};
var mustache = {
  name: "mustache.js",
  version: "4.2.0",
  tags: ["{{", "}}"],
  clearCache: void 0,
  escape: void 0,
  parse: void 0,
  render: void 0,
  Scanner: void 0,
  Context: void 0,
  Writer: void 0,
  /**
   * Allows a user to override the default caching strategy, by providing an
   * object with set, get and clear methods. This can also be used to disable
   * the cache by setting it to the literal `undefined`.
   */
  set templateCache(cache) {
    defaultWriter.templateCache = cache;
  },
  /**
   * Gets the default or overridden caching object from the default writer.
   */
  get templateCache() {
    return defaultWriter.templateCache;
  }
};
var defaultWriter = new Writer();
mustache.clearCache = function clearCache2() {
  return defaultWriter.clearCache();
};
mustache.parse = function parse2(template, tags) {
  return defaultWriter.parse(template, tags);
};
mustache.render = function render2(template, view, partials, config) {
  if (typeof template !== "string") {
    throw new TypeError('Invalid template! Template should be a "string" but "' + typeStr(template) + '" was given as the first argument for mustache#render(template, view, partials)');
  }
  return defaultWriter.render(template, view, partials, config);
};
mustache.escape = escapeHtml;
mustache.Scanner = Scanner;
mustache.Context = Context;
mustache.Writer = Writer;
var mustache_default = mustache;

// node_modules/@workadventure/scripting-api-extra/dist/TemplateValue.js
var TemplateValue = class {
  constructor(template, state) {
    this.template = template;
    this.state = state;
    this.ast = mustache_default.parse(template);
  }
  getValue() {
    if (this.value === void 0) {
      this.value = mustache_default.render(this.template, this.state);
    }
    return this.value;
  }
  onChange(callback) {
    const subscriptions = [];
    for (const variableName of this.getUsedVariables().values()) {
      subscriptions.push(this.state.onVariableChange(variableName).subscribe(() => {
        const newValue = mustache_default.render(this.template, this.state);
        if (newValue !== this.value) {
          this.value = newValue;
          callback(this.value);
        }
      }));
    }
    return {
      unsubscribe: () => {
        for (const subscription of subscriptions) {
          subscription.unsubscribe();
        }
      }
    };
  }
  isPureString() {
    return this.ast.length === 0 || this.ast.length === 1 && this.ast[0][0] === "text";
  }
  getUsedVariables() {
    const variables = /* @__PURE__ */ new Set();
    this.recursiveGetUsedVariables(this.ast, variables);
    return variables;
  }
  recursiveGetUsedVariables(ast, variables) {
    for (const token of ast) {
      const type = token[0];
      const name = token[1];
      const subAst = token[4];
      if (["name", "&", "#", "^"].includes(type)) {
        variables.add(name);
      }
      if (subAst !== void 0 && typeof subAst !== "string") {
        this.recursiveGetUsedVariables(subAst, variables);
      }
    }
  }
};

// node_modules/@workadventure/scripting-api-extra/dist/Features/properties_templates.js
async function initPropertiesTemplatesArea() {
  var _a;
  const areas = await getAreaObject();
  for (const area of areas) {
    const properties = (_a = area.properties) !== null && _a !== void 0 ? _a : [];
    for (const property of properties) {
      if (property.type === "int" || property.type === "bool" || property.type === "object" || typeof property.value !== "string") {
        continue;
      }
      const template = new TemplateValue(property.value, WA.state);
      if (template.isPureString()) {
        continue;
      }
      const newValue = template.getValue();
      await setPropertyArea(area.name, property.name, newValue);
      template.onChange(async (newValue2) => {
        await setPropertyArea(area.name, property.name, newValue2);
      });
    }
  }
}
async function initPropertiesTemplates() {
  var _a;
  const layers = await getLayersMap();
  for (const [layerName, layer] of layers.entries()) {
    if (layer.type !== "objectgroup") {
      const properties = (_a = layer.properties) !== null && _a !== void 0 ? _a : [];
      for (const property of properties) {
        if (property.type === "int" || property.type === "bool" || property.type === "object" || typeof property.value !== "string") {
          continue;
        }
        const template = new TemplateValue(property.value, WA.state);
        if (template.isPureString()) {
          continue;
        }
        const newValue = template.getValue();
        setProperty(layerName, property.name, newValue);
        template.onChange((newValue2) => {
          setProperty(layerName, property.name, newValue2);
        });
      }
    }
  }
}
async function setPropertyArea(areaName, propertyName, value) {
  console.log(areaName);
  const area = await WA.room.area.get(areaName);
  area.setProperty(propertyName, value);
}
function setProperty(layerName, propertyName, value) {
  WA.room.setProperty(layerName, propertyName, value);
  if (propertyName === "visible") {
    if (value) {
      WA.room.showLayer(layerName);
    } else {
      WA.room.hideLayer(layerName);
    }
  }
}

// node_modules/@workadventure/scripting-api-extra/dist/Features/doors.js
var layersMap;
var playerX = 0;
var playerY = 0;
function updateDoorLayers(variable) {
  if (WA.state[variable.name]) {
    let layers = variable.properties.mustGetString("openLayer");
    for (const layer of layers.split("\n")) {
      WA.room.showLayer(layer);
    }
    layers = variable.properties.mustGetString("closeLayer");
    for (const layer of layers.split("\n")) {
      WA.room.hideLayer(layer);
    }
  } else {
    let layers = variable.properties.mustGetString("openLayer");
    for (const layer of layers.split("\n")) {
      WA.room.hideLayer(layer);
    }
    layers = variable.properties.mustGetString("closeLayer");
    for (const layer of layers.split("\n")) {
      WA.room.showLayer(layer);
    }
  }
}
function playOpenSound(variable) {
  const url = variable.properties.getString("openSound");
  const radius = variable.properties.getNumber("soundRadius");
  let volume = 1;
  if (radius) {
    const distance = getDistance(variable.properties.mustGetString("openLayer").split("\n"));
    if (distance > radius) {
      return;
    }
    volume = 1 - distance / radius;
  }
  if (url) {
    WA.sound.loadSound(url).play({
      volume
    });
  }
}
function playCloseSound(variable) {
  const url = variable.properties.getString("closeSound");
  const radius = variable.properties.getNumber("soundRadius");
  let volume = 1;
  if (radius) {
    const distance = getDistance(variable.properties.mustGetString("closeLayer").split("\n"));
    if (distance > radius) {
      return;
    }
    volume = 1 - distance / radius;
  }
  if (url) {
    WA.sound.loadSound(url).play({
      volume
    });
  }
}
function getTileLayers(layerNames) {
  return layerNames.map((layerName) => layersMap.get(layerName)).filter((layer) => (layer === null || layer === void 0 ? void 0 : layer.type) === "tilelayer");
}
function getDistance(layerNames) {
  const layers = getTileLayers(layerNames);
  const boundaries = findLayersBoundaries(layers);
  const xLayer = ((boundaries.right - boundaries.left) / 2 + boundaries.left) * 32;
  const yLayer = ((boundaries.bottom - boundaries.top) / 2 + boundaries.top) * 32;
  return Math.sqrt(Math.pow(playerX - xLayer, 2) + Math.pow(playerY - yLayer, 2));
}
function initDoor(variable) {
  WA.state.onVariableChange(variable.name).subscribe(() => {
    if (WA.state[variable.name]) {
      playOpenSound(variable);
    } else {
      playCloseSound(variable);
    }
    updateDoorLayers(variable);
  });
  updateDoorLayers(variable);
}
function initDoorstep(layer, doorVariable, properties, assetsUrl) {
  const name = layer.name;
  let actionMessage = void 0;
  let keypadWebsite = void 0;
  let inZone = false;
  const tag = properties.getString("tag");
  let allowed = true;
  if (tag && !WA.player.tags.includes(tag)) {
    allowed = false;
  }
  const accessRestricted = !!tag;
  function displayCloseDoorMessage() {
    var _a;
    if (actionMessage) {
      actionMessage.remove();
    }
    actionMessage = WA.ui.displayActionMessage({
      message: (_a = properties.getString("closeTriggerMessage")) !== null && _a !== void 0 ? _a : "Press SPACE to close the door",
      callback: () => {
        WA.state[doorVariable.name] = false;
        displayOpenDoorMessage();
      }
    });
  }
  function displayOpenDoorMessage() {
    var _a;
    if (actionMessage) {
      actionMessage.remove();
    }
    actionMessage = WA.ui.displayActionMessage({
      message: (_a = properties.getString("openTriggerMessage")) !== null && _a !== void 0 ? _a : "Press SPACE to open the door",
      callback: () => {
        WA.state[doorVariable.name] = true;
        displayCloseDoorMessage();
      }
    });
  }
  function openKeypad(name2) {
    const boundaries = findLayersBoundaries(getTileLayers(doorVariable.properties.mustGetString("closeLayer").split("\n")));
    keypadWebsite = WA.room.website.create({
      name: "doorKeypad" + name2,
      url: assetsUrl + "/keypad.html#" + encodeURIComponent(name2),
      position: {
        x: boundaries.right * 32,
        y: boundaries.top * 32,
        width: 32 * 3,
        height: 32 * 4
      },
      allowApi: true
    });
  }
  function closeKeypad() {
    if (keypadWebsite) {
      WA.room.website.delete(keypadWebsite.name);
      keypadWebsite = void 0;
    }
  }
  WA.room.onEnterLayer(name).subscribe(() => {
    inZone = true;
    if (properties.getBoolean("autoOpen") && allowed) {
      WA.state[doorVariable.name] = true;
      return;
    }
    if (!WA.state[doorVariable.name] && (accessRestricted && !allowed || !accessRestricted) && (properties.getString("code") || properties.getString("codeVariable"))) {
      openKeypad(name);
      return;
    }
    if (!allowed) {
      return;
    }
    if (WA.state[doorVariable.name]) {
      displayCloseDoorMessage();
    } else {
      displayOpenDoorMessage();
    }
  });
  WA.room.onLeaveLayer(name).subscribe(() => {
    inZone = false;
    if (properties.getBoolean("autoClose")) {
      WA.state[doorVariable.name] = false;
    }
    if (actionMessage) {
      actionMessage.remove();
    }
    closeKeypad();
  });
  WA.state.onVariableChange(doorVariable.name).subscribe(() => {
    if (inZone) {
      if (!properties.getBoolean("autoClose") && WA.state[doorVariable.name] === true) {
        displayCloseDoorMessage();
      }
      if (keypadWebsite && WA.state[doorVariable.name] === true) {
        closeKeypad();
      }
      if (!properties.getBoolean("autoOpen") && WA.state[doorVariable.name] === false) {
        displayOpenDoorMessage();
      }
    }
  });
}
function playBellSound(variable) {
  const url = variable.properties.mustGetString("bellSound");
  const radius = variable.properties.getNumber("soundRadius");
  let volume = 1;
  if (radius) {
    const distance = Math.sqrt(Math.pow(variable.x - playerX, 2) + Math.pow(variable.y - playerY, 2));
    if (distance > radius) {
      return;
    }
    volume = 1 - distance / radius;
  }
  WA.sound.loadSound(url).play({
    volume
  });
}
function initBell(variable) {
  if (WA.state[variable.name] === void 0) {
    WA.state[variable.name] = 0;
  }
  WA.state.onVariableChange(variable.name).subscribe(() => {
    if (WA.state[variable.name]) {
      playBellSound(variable);
    }
  });
}
function initBellLayer(bellVariable, properties, layerName) {
  let popup = void 0;
  const bellPopupName = properties.getString("bellPopup");
  WA.room.onEnterLayer(layerName).subscribe(() => {
    var _a;
    if (!bellPopupName) {
      WA.state[bellVariable] = WA.state[bellVariable] + 1;
    } else {
      popup = WA.ui.openPopup(bellPopupName, "", [
        {
          label: (_a = properties.getString("bellButtonText")) !== null && _a !== void 0 ? _a : "Ring",
          callback: () => {
            WA.state[bellVariable] = WA.state[bellVariable] + 1;
          }
        }
      ]);
    }
  });
  WA.room.onLeaveLayer(layerName).subscribe(() => {
    if (popup) {
      popup.close();
      popup = void 0;
    }
  });
}
async function initDoors(assetsUrl) {
  assetsUrl = assetsUrl !== null && assetsUrl !== void 0 ? assetsUrl : defaultAssetsUrl;
  const variables = await getVariables();
  layersMap = await getLayersMap();
  for (const variable of variables.values()) {
    if (variable.properties.get("door")) {
      initDoor(variable);
    }
    if (variable.properties.get("bell")) {
      initBell(variable);
    }
  }
  for (const layer of layersMap.values()) {
    const properties = new Properties(layer.properties);
    const doorVariableName = properties.getString("doorVariable");
    if (doorVariableName && layer.type === "tilelayer") {
      const doorVariable = variables.get(doorVariableName);
      if (doorVariable === void 0) {
        throw new Error('Cannot find variable "' + doorVariableName + '" referred in the "doorVariable" property of layer "' + layer.name + '"');
      }
      initDoorstep(layer, doorVariable, properties, assetsUrl);
    }
    const bellVariable = properties.getString("bellVariable");
    if (bellVariable) {
      initBellLayer(bellVariable, properties, layer.name);
    }
  }
  WA.player.onPlayerMove((moveEvent) => {
    playerX = moveEvent.x;
    playerY = moveEvent.y;
  });
}

// node_modules/@workadventure/scripting-api-extra/dist/Features/variable_actions.js
function initVariableActionLayer(properties, layerName) {
  const variableName = properties.getString("bindVariable");
  if (variableName) {
    const enterValue = properties.get("enterValue");
    const leaveValue = properties.get("leaveValue");
    const triggerMessage = properties.getString("triggerMessage");
    const tag = properties.getString("tag");
    setupVariableActionLayer(variableName, layerName, enterValue, leaveValue, triggerMessage, tag);
  }
}
function setupVariableActionLayer(variableName, layerName, enterValue, leaveValue, triggerMessage, tag) {
  if (tag && !WA.player.tags.includes(tag)) {
    return;
  }
  if (enterValue !== void 0) {
    WA.room.onEnterLayer(layerName).subscribe(() => {
      if (triggerMessage) {
      } else {
        WA.state[variableName] = enterValue;
      }
    });
  }
  if (leaveValue !== void 0) {
    WA.room.onLeaveLayer(layerName).subscribe(() => {
      WA.state[variableName] = leaveValue;
    });
  }
}

// node_modules/@workadventure/scripting-api-extra/dist/Iframes/Tutorial/config/config.js
var mobileConfig = [
  {
    lowerBound: 0,
    uppperBound: 0.5,
    config: {
      width: 250,
      height: 390,
      scale: 1
    }
  },
  {
    lowerBound: 0.5,
    uppperBound: 0.8,
    config: {
      width: 224,
      height: 350,
      scale: 0.9
    }
  },
  {
    lowerBound: 0.8,
    uppperBound: 1.25,
    config: {
      width: 132,
      height: 211,
      scale: 0.53
    }
  },
  {
    lowerBound: 1.25,
    uppperBound: 2.28,
    config: {
      width: 64,
      height: 99,
      scale: 0.25
    }
  },
  {
    lowerBound: 1.25,
    config: {
      width: 39,
      height: 63,
      scale: 0.16
    }
  }
];
var desktopConfig = [
  {
    lowerBound: 0,
    uppperBound: 1,
    config: {
      width: 427,
      height: 270,
      scale: 1
    }
  },
  {
    lowerBound: 1,
    uppperBound: 1.9,
    config: {
      width: 300,
      height: 188,
      scale: 0.7
    }
  },
  {
    lowerBound: 1.9,
    uppperBound: 3.5,
    config: {
      width: 150,
      height: 94,
      scale: 0.35
    }
  },
  {
    lowerBound: 3.5,
    uppperBound: 5,
    config: {
      width: 93,
      height: 58,
      scale: 0.21
    }
  },
  {
    lowerBound: 4,
    config: {
      width: 75,
      height: 46,
      scale: 0.17
    }
  }
];

// node_modules/@workadventure/scripting-api-extra/dist/Features/tutorial.js
async function initTutorial() {
  var _a;
  const tutorialDone = WA.player.state.tutorialDone;
  const isForMobile = /Mobi|Android/i.test(navigator.userAgent);
  const map = await WA.room.getTiledMap();
  const tutorialProperty = await ((_a = map.properties) === null || _a === void 0 ? void 0 : _a.find((property) => property.name === "tutorial"));
  const isTutorialEnabled = tutorialProperty && tutorialProperty.value;
  if (!tutorialDone && isTutorialEnabled) {
    openTutorial(isForMobile);
    let playerPosition = await WA.player.getPosition();
    let camera;
    const tutorialIFrame = await WA.room.website.get("tutorial");
    const updatePosition = () => {
      const margin = 16;
      const rightBorderCrossed = playerPosition.x + tutorialIFrame.x + tutorialIFrame.width > camera.x + camera.width;
      const leftBorderCrossed = playerPosition.x + tutorialIFrame.x < camera.x;
      const topBorderCrossed = playerPosition.y + tutorialIFrame.y + tutorialIFrame.height > camera.y + camera.height;
      const bottomBorderCrossed = playerPosition.y + tutorialIFrame.y < camera.y;
      if (rightBorderCrossed) {
        tutorialIFrame.x = -tutorialIFrame.width - 1.5 * margin;
      } else if (leftBorderCrossed) {
        tutorialIFrame.x = 1.5 * margin;
      }
      if (topBorderCrossed) {
        tutorialIFrame.y = -tutorialIFrame.height;
      } else if (bottomBorderCrossed) {
        tutorialIFrame.y = margin;
      }
    };
    const processIframeConfig = (config) => {
      tutorialIFrame.width = config.width;
      tutorialIFrame.height = config.height;
      tutorialIFrame.scale = config.scale;
    };
    const updateProportions = (zoomLevel) => {
      const config = isForMobile ? mobileConfig : desktopConfig;
      const iframeConfig = config.filter((config2) => {
        if (config2.lowerBound && config2.uppperBound) {
          return config2.lowerBound < zoomLevel && zoomLevel <= config2.uppperBound;
        } else if (config2.lowerBound && !config2.uppperBound) {
          return config2.lowerBound < zoomLevel;
        } else if (!config2.lowerBound && config2.uppperBound) {
          return zoomLevel <= config2.uppperBound;
        } else {
          throw new Error(`Zoom level of: ${zoomLevel} could not fit in any of the desktopConfig's ranges.`);
        }
      });
      processIframeConfig(iframeConfig[0].config);
    };
    const updateTutorial = () => {
      if (camera === void 0) {
        return;
      }
      const zoomLevel = camera.zoom;
      updateProportions(zoomLevel);
      updatePosition();
    };
    WA.player.onPlayerMove((position) => {
      playerPosition = position;
      updateTutorial();
    });
    WA.camera.onCameraUpdate().subscribe((cameraPosition) => {
      camera = cameraPosition;
      updateTutorial();
    });
    WA.player.state.tutorialDone = true;
  }
}
function openTutorial(isForMobile) {
  let config = {
    allow: "",
    name: "tutorial",
    url: defaultAssetsUrl + "/tutorial.html",
    position: {
      height: 224,
      width: 407,
      x: 16,
      y: -112
    },
    visible: true,
    allowApi: true,
    origin: "player",
    scale: 0.9
  };
  if (isForMobile) {
    config = { ...config, position: { x: 32, y: -225, height: 390, width: 250 }, scale: 1 };
  }
  WA.room.website.create(config);
}

// node_modules/@workadventure/scripting-api-extra/dist/Features/tutorialv1.js
function launchTutorialv1() {
  let hots = defaultAssetsUrl;
  if (process.env.WORKADVENTURE_URL != void 0 && process.env.WORKADVENTURE_URL !== "") {
    hots = process.env.WORKADVENTURE_URL.replace("play.", "extra.");
  }
  const tutoUrl = `${hots}/tutorialv1.html`;
  console.info("Start onboarding application!", tutoUrl);
  console.info("Player tutorial done information: ", WA.player.state.tutorialDone);
  if (WA.player.state.tutorialDone)
    return;
  WA.ui.modal.openModal({
    src: tutoUrl,
    allow: "fullscreen; clipboard-read; clipboard-write",
    allowApi: true,
    position: "right"
  });
}

// node_modules/@workadventure/scripting-api-extra/dist/Features/special_properties.js
async function initSpecialProperties() {
  const layers = await getLayersMap();
  for (const layer of layers.values()) {
    const properties = new Properties(layer.properties);
    initVariableActionLayer(properties, layer.name);
  }
}

// node_modules/@workadventure/scripting-api-extra/dist/Features/configuration.js
var layersMap2;
async function initConfiguration(assetsUrl) {
  const map = await WA.room.getTiledMap();
  assetsUrl = assetsUrl !== null && assetsUrl !== void 0 ? assetsUrl : defaultAssetsUrl;
  layersMap2 = await getLayersMap();
  const configurationLayer = map.layers.find((layer) => layer.name === "configuration");
  if (configurationLayer) {
    const properties = new Properties(configurationLayer.properties);
    const tag = properties.getString("tag");
    if (!tag || WA.player.tags.includes(tag)) {
      WA.ui.registerMenuCommand("Configure the room", () => {
        WA.nav.openCoWebSite(assetsUrl + "/configuration.html", true);
      });
    }
    for (const layer of layersMap2.values()) {
      const properties2 = new Properties(layer.properties);
      const openConfigVariables = properties2.getString("openConfig");
      if (openConfigVariables && layer.type === "tilelayer") {
        initLocalConfigurationPanel(openConfigVariables.split(","), layer.name, properties2);
      }
    }
  }
}
function initLocalConfigurationPanel(openConfigVariables, layerName, properties) {
  let actionMessage = void 0;
  const tag = properties.getString("openConfigAdminTag");
  let allowedByTag = true;
  if (tag && !WA.player.tags.includes(tag)) {
    allowedByTag = false;
  }
  function displayConfigurationMessage() {
    var _a;
    if (actionMessage) {
      actionMessage.remove();
    }
    actionMessage = WA.ui.displayActionMessage({
      message: (_a = properties.getString("openConfigTriggerMessage")) !== null && _a !== void 0 ? _a : "Press SPACE or touch here to configure",
      callback: () => openConfig(openConfigVariables)
    });
  }
  function closeConfigurationPanel() {
    WA.nav.closeCoWebSite();
  }
  WA.room.onEnterLayer(layerName).subscribe(() => {
    const openConfigTriggerValue = properties.getString("openConfigTrigger");
    if (allowedByTag) {
      if (openConfigTriggerValue && openConfigTriggerValue === "onaction") {
        displayConfigurationMessage();
      } else {
        openConfig(openConfigVariables);
      }
    }
  });
  WA.room.onLeaveLayer(layerName).subscribe(() => {
    if (actionMessage) {
      actionMessage.remove();
      closeConfigurationPanel();
    } else {
      closeConfigurationPanel();
    }
  });
}

// node_modules/@workadventure/scripting-api-extra/dist/init.js
function bootstrapExtra() {
  return WA.onInit().then(() => {
    initDoors().catch((e) => console.error(e));
    initSpecialProperties().catch((e) => console.error(e));
    initConfiguration().catch((e) => console.error(e));
    initPropertiesTemplates().catch((e) => console.error(e));
    initPropertiesTemplatesArea().catch((e) => console.error(e));
  }).catch((e) => console.error(e));
}
export {
  Properties,
  VariableDescriptor,
  bootstrapExtra,
  findLayerBoundaries,
  findLayersBoundaries,
  getAreaObject,
  getLayersMap,
  getVariables,
  initDoors,
  initPropertiesTemplates,
  initPropertiesTemplatesArea,
  initTutorial,
  initVariableActionLayer,
  launchTutorialv1,
  openConfig
};
/*! Bundled license information:

mustache/mustache.mjs:
  (*!
   * mustache.js - Logic-less {{mustache}} templates with JavaScript
   * http://github.com/janl/mustache.js
   *)
*/
//# sourceMappingURL=@workadventure_scripting-api-extra.js.map
