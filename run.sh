<<<<<<< HEAD
=======
REPO_LINK="https://github.com/TeamFreeHugs/TeamFreeHugsWebsite.git"

if [ "$(which nodejs)" == "" ]; then
  echo "NodeJS not found!"
  echo "Installing NodeJS, please wait..."
  wget -qO- https://deb.nodesource.com/setup_4.x | sudo bash -
  sudo apt-get install --yes nodejs
fi

if [ "$(which git)" == "" ]; then
  echo "Git not found!"
  echo "Installing Git, please wait..."
  sudo apt-get install --yes git
fi

if [ ! -f bin/www ]; then
  git clone https://github.com/TeamFreeHugs/TeamFreeHugsWebsite.git
  npm install -d
fi

sleep 1
clear
echo "Server started."

>>>>>>> 6e5430860fd25cbd0e6ffd723da0460a339f4e82
nodejs bin/www
