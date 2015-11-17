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