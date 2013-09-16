---
layout: post
title: "Managing Multiple Github Accounts"
date: 2013-09-16 07:43
comments: true
categories: github
---

Let's look at how to manage multiple Github accounts from one computer. In essence, it's simply a matter of balancing both your git and ssh configurations - which actually is not as bad as it might seem. 

> Note: This tutorial is meant for Unix users. 


## Set up SSH Keys

Let's assume your two Github accounts are named *githubPersonal* and *githubWork*, respectively. 

Create two SSH keys, saving each to a separate file:


    $ cd ~/.ssh
    $ ssh-keygen -t rsa -C "your_email@associated_with_githubPersonal.com"
    # save it as id_rsa_personal when prompted
    $ ssh-keygen -t rsa -C "your_email@associated_with_githubWork.com"
    # save it as id_rsa_work when prompted


The above commands setup the following files:
    
- *id_rsa_personal*
- *id_rsa_personal.pub*
- *id_rsa_work*
- *id_rsa_work.pub*

## Add the keys to your Github accounts:

1. Copy the key to your clipboard:

    
       $ pbcopy < ~/.ssh/id_rsa_personal.pub
    
    
2. Add the key to your account:

    - Go to your Account Settings
    - Click "SSH Keys" then "Add SSH key"
    - Paste your key into the "Key" field and add a relevant title
    - Click "Add key" then enter your Github password to confirm


3. Repeat the process for your *githubWork* account.

## Create a configuration file to manage the separate keys

1. Create a config file in ~/.ssh/

    
       $ touch config
    
    
2. Edit the file using the text editor of your choice. I used vim - `$ vim config`:
    
       # githubPersonal
       Host personal
           HostName github.com
           User git
           IdentityFile ~/.ssh/id_rsa_personal
 
       # githubWork
       Host work
           HostName github.com
           User git
           IdentityFile ~/.ssh/id_rsa_work
    
## Update stored identities

1. Clear currently stored identities:
    
    
       $ ssh-add -D
    
    
2. Add new keys:
    
    
       $ ssh-add id_rsa_personal
       $ ssh-add id_rsa_work
    
3. Test to make sure new keys are stored:    
    
    
       $ ssh-add -l
    
    
4. Test to make sure Github recognizes the keys:

    
       $ ssh -T personal
       Hi githubPersonal! You've successfully authenticated, but GitHub does not provide shell access.
       $ ssh -T work
       Hi githubWork! You've successfully authenticated, but GitHub does not provide shell access.
    

    
## Test PUSH

1. On Github, create a new repo in your personal account, *githubPersonal*, called *test-personal*.

2. Back on your local machine, create a test directory:

       $ cd ~/documents
       $ mkdir test-personal
       $ cd test-personal
    
2. Add a blank "readme.md" file and PUSH to Github:

    
       $ touch readme.md
       $ git init
       $ git add .
       $ git commit -am "first commit"
       $ git remote add origin git@personal:githubPersonal/test-personal.git
       $ git push origin master
    
    
    > Notice how we're using the custom account, `git@personal`, instead of `git@github.com`. 
    
3. Repeat the process for your *githubWork* account.

## Test PULL

1. Add some text to the *readme.md* file in your personal account on Github.

2. Now PULL and merge the changes by running the following command within the *test-personal* directory:

     
       $ git pull origin master
    
    
3. Again, repeat this for your *githubWork* account.


<br/>

Questons? Comments? Did I miss something? Comment below.