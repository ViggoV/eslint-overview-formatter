const logSymbols = require('log-symbols');
const path = require('path');


module.exports = function(results) {
  results = results || [];

  let nested = {};
  let final = '';
  let root = path.resolve('.');

  results.forEach((res) => {

    let relativePath = path.relative(root, res.filePath);
    let splitpath = relativePath.split('/');

    let current = nested;

    splitpath.forEach(function(subpath) {
      if (current.hasOwnProperty(subpath)) {
        current = current[subpath];
      } else {
        current = current[subpath] = {};
      }
    });

    current['error_count'] = res.errorCount;
    let tmp_errors = res.messages.filter(m => m.severity===2);
    current['errors'] = tmp_errors.reduce((acc, cur) => {
      let exists = acc && acc.hasOwnProperty(cur.ruleId);
      if (exists) acc[cur.ruleId].push(`${cur.line}:${cur.column}`);
      else acc[cur.ruleId] = [`${cur.line}:${cur.column}`];
      return acc;
    }, {});
    
    current['warning_count'] = res.warningCount;
    let tmp_warnings = res.messages.filter(m => m.severity===1);
    current['warnings'] = tmp_warnings.reduce((acc, cur) => {
      let exists = acc && acc.hasOwnProperty(cur.ruleId);
      if (exists) acc[cur.ruleId].push(`${cur.line}:${cur.column}`);
      else acc[cur.ruleId] = [`${cur.line}:${cur.column}`];
      return acc;
    }, {});

  });

  let output = '';
  const isObjFile = obj => (obj && (obj.hasOwnProperty('errors') || obj.hasOwnProperty('warning')));

  function theLoop(obj, key, indent, last_key=true) {

    let isFile = isObjFile(obj);

    let indent_string = indent.slice(0, indent.length-1).map(ind => dim(ind==1 ? ' │ ' : '   ')).join('');
    output += indent_string;

    if (key) {
      output += dim(last_key ? ' └ ' : ' ├ ');
      output += isFile ? lightgrey(`${key}`) : ul(`${key}`);
    } else output += ul('Project');

    output += '\n';

    if (isFile) {
      // print errors
      let last_indent = dim(last_key ? '   ' : ' │ ');
      if (obj.error_count > 0) {
        let error_string = Object.keys(obj.errors).map(k => `${k}(${obj.errors[k].join(',')})`).join(', ');
        output += `${indent_string}${last_indent} ${logSymbols.error} `;
        output += red(`${obj.error_count} errors: [${error_string}]`);
        output += '\n';
      }
      if (obj.warning_count > 0) {
        let warning_string = Object.keys(obj.warnings).map(k => `${k}(${obj.warnings[k].join(',')})`).join(', ');
        output += `${indent_string}${last_indent} ${logSymbols.warning} `;
        output += yellow(` ${obj.warning_count} warnings: [${warning_string}]`);
        output += '\n';
      }

    } else {
      // object is folder

      let child_keys = Object.keys(obj).sort((ka,kb) => {
        // sort keys: files first, alphabetic
        let oa = obj[ka], ob = obj[kb];
        if (isObjFile(oa) === isObjFile(ob)) return (ka < kb) ? -1 : (ka > kb ? 1 : 0);
        else if (isObjFile(oa)) return -1;
        else return 1;
      });
      if (child_keys) child_keys.forEach((k,i,a) => theLoop(obj[k],k, [...indent, (i < a.length-1) ? 1 : 0], i == a.length-1));
    } 

  }

  theLoop(nested, null, []);

  final = output;

  return final;
};

function ul(text) {
  return `\x1b[4m${text}\x1b[0m`;
}

function dim(text) {
  return `\x1b[2m${text}\x1b[22m`;
}

function lightgrey(text) {
  return `\x1b[37m${text}\x1b[0m`;
}

function red(text) {
  return `\x1b[31m${text}\x1b[0m`;
}

function yellow(text) {
  return `\x1b[33m${text}\x1b[0m`;
}