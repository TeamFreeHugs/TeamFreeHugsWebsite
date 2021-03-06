Number.prototype.bound = function (e, t) {
    return isNaN(t) ? Math.min(this, e) : Math.max(Math.min(this, t), e)
};

function passStrength(pass) {
    var uniqueChars = [];
    for (var i = 0; i < pass.length; i++) {
        if (uniqueChars.indexOf(pass[i]) == -1) uniqueChars.push(pass[i]);
    }
    var penalties = /(.+?)(.*)(\1+)/g,
        match,
        deductions = 0;
    while (match = penalties.exec(pass)) {
        //print('Match found: ' + match);
        deductions += (4 - match[2].length / 2).bound(0.5, 3) * Math.pow(match[1].length + match[3].length, 1.4) / Math.sqrt(match[1].length + 3);
    }
    penalties = /\d+/g;
    while (match = penalties.exec(pass)) {
        //print('Match found: ' + match);
        deductions += Math.pow(match[0].length, 3 / 2);
    }
    penalties = /\w{2,}/gi;
    while (match = penalties.exec(pass)) {
        //print('Match found: ' + match);
        deductions += match[0].length * 1.5;
    }
    return uniqueChars.length * 2.5 - Math.pow(deductions, 2 / 3) * 0.5 + pass.length * 0.62;
}

function getQueryHash(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&#]" + name + "=([^&#]*)"), results = regex
        .exec(location.hash);
    return results === null ? "" : decodeURIComponent(results[1].replace(
        /\+/g, " "));
}
function getQueryString(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&#]" + name + "=([^&#]*)"), results = regex
        .exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(
        /\+/g, " "));
}


'use strict';
String.prototype.replaceAll = function (find, replace) {
    if (typeof find == 'string') return this.split(find).join(replace);
    var t = this, i, j;
    while (typeof(i = find.shift()) == 'string' && typeof(j = replace.shift()) == 'string') t = t.replaceAll(i || '', j || '');
    return t;
};
function html(input, attribute) {
    if (attribute) return input.toString().replaceAll(['&', '<', '"', '\t', '\n', '\b'], ['&amp;', '&lt;', '&quot;', '&#9;', '&#10;', '']);
    return input.toString().replaceAll(['&', '<', '\b'], ['&amp;', '&lt;', '']);
}
function warning(message) {
    console.log(message);
}
function spanMarkdown(input) {
    input = html(input);
    while (input.match(/\^([\w\^]+)/)) input = input.replace(/\^([\w\^]+)/, '<sup>$1</sup>');
    return input
        .replaceAll('\u0001', '^')
        .replace(/\[(.+?)\|(.+?)\]/g, '<abbr title="$2">$1</abbr>')
        .replaceAll('\u0002', '[')
        .replace(/\[\[(\d+)\](.*?)\]/g, '<sup class="reference" title="$2">[$1]</sup>')
        .replace(/\[\[ !\[([^\[\]]+?)]\(https?:\/\/([^\s("\\]+?\.[^\s"\\]+?)\) \]\]/g, '<img alt="$1" class="center" src="https://$2" />')
        .replace(/!\[([^\[\]]+?)]\(https?:\/\/([^\s("\\]+?\.[^\s"\\]+?)\)/g, '<img alt="$1" src="https://$2" />')
        .replace(/\[([^\[\]]+)]\((https?:\/\/[^\s()"\[\]]+?\.[^\s"\\\[\]]+?)\)/g, '$1'.link('$2'))
        .replace(/(\s|^)https?:\/\/([^\s()"]+?\.[^\s"]+?\.(svg|png|tiff|jpg|jpeg)(\?[^\s"\/]*)?)/g, '$1<img src="https://$2" />')
        .replace(/(\s|^)(https?:\/\/([^\s()"]+?\.[^\s"()]+))/g, '$1' + '$3'.link('$2'));
}
function inlineMarkdown(input) {
    var output = '',
        span = '',
        current = [],
        tags = {
            '`': 'code',
            '``': 'samp',
            '*': 'em',
            '**': 'strong',
            '_': 'i',
            '–––': 's',
            '+++': 'ins',
            '---': 'del',
            '[c]': 'cite',
            '[m]': 'mark',
            '[u]': 'u',
            '[v]': 'var',
            '::': 'kbd',
            '"': 'q'
        },
        stags = {
            sup: {
                start: '^(',
                end: ')^'
            },
            sub: {
                start: 'v(',
                end: ')v'
            },
            small: {
                start: '[sm]',
                end: '[/sm]'
            }
        };
    outer: for (var i = 0; i < input.length; i++) {
        if (['code', 'samp'].indexOf(current[current.length - 1]) == -1) {
            if (input[i] == '\\') span += input[++i].replace('^', '\u0001').replace('[', '\u0002');
            else {
                for (var l = 3; l > 0; l--) {
                    if (tags[input.substr(i, l)]) {
                        output += spanMarkdown(span);
                        span = '';
                        if (current[current.length - 1] == tags[input.substr(i, l)]) output += '</' + current.pop() + '>';
                        else {
                            if (current.indexOf(tags[input.substr(i, l)]) != -1) warning('Illegal nesting of "' + input.substr(i, l) + '"');
                            output += '<' + tags[input.substr(i, l)] + '>';
                            current.push(tags[input.substr(i, l)]);
                        }
                        i += l - 1;
                        continue outer;
                    }
                }
                for (var j in stags) {
                    for (var l = 5; l > 0; l--) {
                        if (stags[j].start == input.substr(i, l)) {
                            output += spanMarkdown(span) + '<' + j + '>';
                            span = '';
                            current.push(j);
                            i += l - 1;
                            continue outer;
                        } else if (stags[j].end == input.substr(i, l)) {
                            if (stags[current[current.length - 1]] == stags[j]) {
                                output += spanMarkdown(span) + '</' + j + '>';
                                span = '';
                                current.pop();
                                i += l - 1;
                                continue outer;
                            } else warning('Illegal close tag "' + stags[j].end + '" found');
                        }
                    }
                }
                span += input[i];
            }
        } else if (current[current.length - 1] == 'code' && input[i] == '`') {
            current.pop();
            output += '</code>';
        } else if (current[current.length - 1] == 'samp' && input.substr(i, 2) == '``') {
            current.pop();
            output += '</samp>';
            i++;
        } else output += html(input[i]);
    }
    output += spanMarkdown(span);
    if (current.length) warning('Unclosed tags. <' + current.join('>, <') + '>');
    for (var i = current.length - 1; i >= 0; i--) output += '</' + current[i] + '>';
    return output;
}
function markdown(input) {
    var blockquote = '',
        ul = '',
        ol = '',
        li = '',
        code = '';
    return input.split('\n').map(function (val, i, arr) {
        if (!val) return '';
        var f;
        if (val.substr(0, 2) == '> ') {
            val = val.substr(2);
            if (arr[i + 1] && arr[i + 1].substr(0, 2) == '> ') {
                blockquote += val + '\n';
                return '';
            } else {
                var arg = blockquote + val;
                blockquote = '';
                return '<blockquote>' + markdown(arg) + '</blockquote>';
            }
        } else if (val.substr(0, 3) == '>! ') {
            val = val.substr(3);
            if (arr[i + 1] && arr[i + 1].substr(0, 3) == '>! ') {
                blockquote += val + '\n';
                return '';
            } else {
                var arg = blockquote + val;
                blockquote = '';
                return '<blockquote class="spoiler">' + markdown(arg) + '</blockquote>';
            }
        } else if (val.substr(0, 2) == '- ' || val.substr(0, 2) == '* ') {
            if (!ul) ul = '<ul>';
            val = val.substr(2);
            if (li) {
                ul += '<li>' + markdown(li) + '</li>';
                li = '';
            }
            if (arr[i + 1] && (arr[i + 1].substr(0, 2) == '- ' || arr[i + 1] && arr[i + 1].substr(0, 2) == '* ')) {
                ul += '<li>' + inlineMarkdown(val) + '</li>';
                return '';
            } else if (arr[i + 1] && (arr[i + 1][0] == '\t' || arr[i + 1] && arr[i + 1].substr(0, 4) == '    ')) {
                li += val + '\n';
                return '';
            } else {
                var arg = ul + '<li>' + inlineMarkdown(val) + '</li>';
                ul = '';
                return arg + '</ul>';
            }
        } else if (f = val.match(/^(\d+|[A-z])[.)] /)) {
            if (!ol) ol = '<ol>';
            val = val.substr(f[0].length);
            if (li) {
                ol += '<li>' + markdown(li) + '</li>';
                li = '';
            }
            if (arr[i + 1] && arr[i + 1].match(/^(\d+|[A-z])[.)] /)) {
                ol += '<li>' + inlineMarkdown(val) + '</li>';
                return '';
            } else if (arr[i + 1] && (arr[i + 1][0] == '\t' || arr[i + 1] && arr[i + 1].substr(0, 4) == '    ')) {
                li += val + '\n';
                return '';
            } else {
                var arg = ol + '<li>' + inlineMarkdown(val) + '</li>';
                ol = '';
                return arg + '</ol>';
            }
        } else if (li && val[0] == '\t') {
            li += val.substr(1) + '\n';
            if (ul && (!arr[i + 1] || (arr[i + 1][0] != '\t' && arr[i + 1].substr(0, 4) != '    ' && arr[i + 1].substr(2) != '- ' && arr[i + 1].substr(2) != '* '))) {
                var arg = ul + '<li>' + markdown(li) + '</li>';
                li = '';
                return arg + '</ul>';
            } else if (ol && (!arr[i + 1] || (arr[i + 1][0] != '\t' && arr[i + 1].substr(0, 4) != '    ' && !arr[i + 1].match(/^(\d+|[A-z])[.)] /)))) {
                var arg = ol + '<li>' + markdown(li) + '</li>';
                li = '';
                return arg + '</ol>';
            }
            return '';
        } else if (li && val.substr(0, 4) == '    ') {
            li += val.substr(4) + '\n';
            if (ul && (!arr[i + 1] || (arr[i + 1][0] != '\t' && arr[i + 1].substr(0, 4) != '    ' && arr[i + 1].substr(2) != '- ' && arr[i + 1].substr(2) != '* '))) {
                var arg = ul + '<li>' + markdown(li) + '</li>';
                li = '';
                return arg + '</ul>';
            } else if (ol && (!arr[i + 1] || (arr[i + 1][0] != '\t' && arr[i + 1].substr(0, 4) != '    ' && !arr[i + 1].match(/^((\d+|[A-z])|[A-z])[.)] /)))) {
                var arg = ol + '<li>' + markdown(li) + '</li>';
                li = '';
                return arg + '</ol>';
            }
            return '';
        } else if (val[0] == '\t') {
            code += val.substr(1);
            if (!arr[i + 1] || (arr[i + 1].substr(0, 4) != '    ' && arr[i + 1][0] != '\t')) {
                var arg = html(code);
                code = '';
                return '<pre>' + arg + '</pre>';
            } else code += '\n';
            return '';
        } else if (val.substr(0, 4) == '    ') {
            code += val.substr(4);
            if (!arr[i + 1] || (arr[i + 1].substr(0, 4) != '    ' && arr[i + 1][0] != '\t')) {
                var arg = html(code);
                code = '';
                return '<pre>' + arg + '</pre>';
            } else code += '\n';
            return '';
        } else if ((f = val.match(/^#{1,6}/)) && (f = f[0].length)) {
            return '<h' + f + '>' + inlineMarkdown(val.substr(f)) + '</h' + f + '>';
        } else if (val.match(/^[-–—]{12,}$/)) {
            return '<hr />';
        } else if (i = val.match(/^cite\[(\d+)]: /)) {
            return '<div><sup class="reference-list">' + i[1] + '</sup> ' + inlineMarkdown(val.substr(i[0].length)) + '</div>';
        } else return '<p>' + inlineMarkdown(val) + '</p>';
    }).join('');
}