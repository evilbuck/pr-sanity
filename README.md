# PR-Sanity Chrome Extension for GitHub

I created this because GitHub has a lousy interface for reviewing
multiple PR's. I wanted to look at the Pull Requests and quickly see
  * who is assigned
  * how many files were changed
  * if there was a failed or passing message in the status update

# Getting Started
  
  - clone this repo
  - open the extensions pane in chrome by visiting ```chrome://extensions``` in the address bar
  - enable developer mode by checking "Developer mode" in the top right
  - click "Load unpacked extension..."
  - browse to cloned repo in the subfolder "chrome" e.g.  ~/pr-sanity/chrome
    
That's it. The next time you visit the Pull Requests page, it should
update each Pull Request with the assignee and the number of files
changed. 
