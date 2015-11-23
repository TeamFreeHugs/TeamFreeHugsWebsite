function canStringPingUser(pingString, userToPing) {
    pingString = pingString.toLowerCase();
    userToPing = userToPing.toLowerCase();
    if (pingString.startsWith('@'))
        pingString = pingString.substr(1);
    if (pingString.length < 3)
        return false;
    return !!userToPing.match(new RegExp(pingString.replace(/\./, '\\.').replace(/\(/, '\\(').replace(/-/, '\\-')))
}

