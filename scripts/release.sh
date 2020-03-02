#! /bin/bash
standard-version --dry-run | sed -n '/---/,/---/p' | sed '1d;$d' | msee
while true; do
    read -p "Proceed with this release? [y/N] " yn
    case $yn in
        [Yy]* ) break;;
        * ) printf "\n🚨 Release process aborted"; exit;;
    esac
done

standard-version
tag=$(git describe --abbrev=0 --tags)
repo_url=$(git remote get-url origin | perl -pe "s/git\@github\.com:([\w._-]+)\/([\w._-]+)\.git/https:\/\/github.com\/\1\/\2/")
printf "\n🛫 Pushing changes to remote"
git push origin master $tag --quiet
printf "\n\n🎉 Release created: $repo_url/releases/tag/$tag"
