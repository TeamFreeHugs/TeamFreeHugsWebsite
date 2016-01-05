# TeamFreeHugsWebsite
A new Team Free Hugs website writen in NodeJS, Stylus, JavaScript and Jade.

#IMPORTANT
This few things were used in this project:

1. Markdown-HTML by @bjb568. [Link here](https://github.com/bjb568/Markdown-HTML)

2. Password Strength by @bjb568 as well. [Link here](https://devdoodle.net/dev/31)

3. Node-login by @braitsch. [Link here](https://github.com/braitsch/node-login)

4. MouseTrap by @ccampbell. [Link here](https://github.com/ccampbell/mousetrap)

5. jQuery-highlight by @bartaz. [Link here](https://github.com/bartaz/sandbox.js/blob/master/jquery.highlight.js)

#HOW TO RUN
1\. Run this code: (`sudo` required!)

    wget -qO- https://deb.nodesource.com/setup_4.x | sudo bash -
    sudo apt-get install --yes nodejs
    
(Taken from [this](http://askubuntu.com/a/673033/241602) Ask Ubuntu answer.)

2\. Download git:

    sudo apt-get install --yes git
    
3\. Run this code:

    git clone https://github.com/TeamFreeHugs/TeamFreeHugsWebsite.git
    cd TeamFreeHugsWebsite
    npm install -d

4\. You're good to go! Run this to start the server:

    nodejs bin/www


##Additional Thanks to:

[http://colorpicker.com](http://www.colorpicker.com/) for their awesome [color chart!](http://www.colorpicker.com/color-chart/)

[Berserk](http://stackexchange.com/users/3522053/berserk) for finding bugs in this

If you want SSL / HTTPS, run this:

    mkdir https
    cd https
    openssl genrsa -des3 -out ca.key 2048
    openssl req -new -key ca.key -out ca.csr
    openssl x509 -req -days 3650 -in ca.csr -out ca.crt -signkey ca.key
    openssl genrsa -des3 -out server.key 2048
    openssl req -new -key server.key -out server.csr
    cp server.key server.key.passphrase
    openssl rsa -in server.key.passphrase -out server.key
    openssl x509 -req -days 3650 -in server.csr -signkey server.key -out server.crt