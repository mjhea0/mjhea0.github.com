---
layout: post
toc: true
title: "Basic Git Commands"
date: 2013-10-11 11:19
comments: true
categories: git
---

Here you will find a quick, high-level overview of some of the major Git commands along with short descriptions and examples. For simplicity, the commands are divided into four sections: *initializing*, *staging*, *committing*, and *maintaining*. Specifically, we will be covering these commands: `config`, `init`, `clone`, `add`, `status`, `commit`, `push`, `pull`, `log`, and `reset`.

> Before you read on, I assume you have [Git](http://git-scm.com/book/en/Getting-Started-Installing-Git) installed. You also want to associate your email address with your account.

Check to see which email address is associated to Git:

``` sh
$ git config user.email
```

You can update the email if necessary:

``` sh
$ git config --global user.email "myemail@address.com"
```

## Initializing

As you probably know, Git is a [version control](http://en.wikipedia.org/wiki/Revision_control) system, which allows you to save snapshots of your projects into repositories. Before you can start taking snapshots though, you have to establish a repository by either creating one from scratch or by copying an already established repository.

- `git init` initializes a new empty repository on your local machine:

``` sh
$ git init
Initialized empty Git repository in /Users/michaelherman/Documents/repos/github/git-commands/.git/
```

- `git clone <url>` clones (or copies) a git repository to your local machine. When you clone, you do not need to initialize a new repository because cloning copies all files, including the *actual* repository.

``` sh
$ git clone git@github.com:mjhea0/sinatra-blog.git
Cloning into 'sinatra-blog'...
remote: Counting objects: 48, done.
remote: Compressing objects: 100% (36/36), done.
remote: Total 48 (delta 14), reused 44 (delta 10)
Receiving objects: 100% (48/48), 10.05 KiB, done.
Resolving deltas: 100% (14/14), done.
```

To see the repo, navigate into the directory and then view all files. You'll see a hidden directory called ".git", which is the actual repository:

``` sh
$ cd sinatra-blog
$ ls -a
```

## Staging

The goal of really any version control system is to save periodic snapshots of your projects. Once you have a snapshot saved, you can feel safe working on your project as you can always revert back to an earlier snapshot if you make a huge error.

If saving the snapshot is the goal, then staging is the actual act of taking the snapshot before you add it to the photo album (repository) for safe keeping.

- `git add <filename>` adds a new file to staging. This file is now ready to be committed. Remember, you have taken the snapshot but not saved it yet. It's in the queue waiting to be added (or committed) to your local repository.

``` sh
$ git add readme.md
```

- `git add .` adds all files in the current directory and all sub directories to your local working directory.
- `git status` lists all files ready to be committed, which have been added to staging, and files not currently being tracked by Git. Use this command to view the state of your working directory and staging area.

I added "readme.md" to staging. However, there's another file in the directory, "test.md", which has not been added. Let's see what `git status` has to say:

``` sh
$ ls
readme.md	test.md
$ git status
# On branch master
#
# Initial commit
#
# Changes to be committed:
#   (use "git rm --cached <file>..." to unstage)
#
#	new file:   readme.md
#
# Untracked files:
#   (use "git add <file>..." to include in what will be committed)
#
#	test.md
```

So, while "readme.md" is in staging, ready to be committed, "test.md", is not being tracked.

``` sh
$ git add .
$ git status
# On branch master
#
# Initial commit
#
# Changes to be committed:
#   (use "git rm --cached <file>..." to unstage)
#
#	new file:   readme.md
#	new file:   test.md
#
```

### Committing

After taking a snapshot, you want to move the snapshot from staging to your actual repository. Committing achieves this. From there you have the option of continuing to work locally or sharing those commits to a remote repository, perhaps on your web hosting platform or on Github.

- `git commit -am ‘<add note>’` commits new and updated files - moving them from the staging queue to your local repository. Make sure the note you add is relevant - that is, it summarizes the changes or updates you've made.

``` sh
$ git commit -am "initial commit"
[master 93127ee] initial commit
2 files changed, 2 insertions(+)
```

What does `git status` say now?

``` sh
$ git status
# On branch master
nothing to commit (working directory clean)
```

- `git push origin master` gathers all the committed files from your local repository and uploads them to a remote repository. Keep in mind that not all files are included in the upload; only new files and files that contain changes. Put another way, this command syncs your local repository and external repository so they are *exactly* the same.

> Before you can push, you must add a remote repository to share your local repository with, which you'll see in the example.

``` sh
$ git remote add origin git@github.com:mjhea0/git-commands.git
$ git push origin master
Counting objects: 6, done.
Delta compression using up to 4 threads.
Compressing objects: 100% (4/4), done.
Writing objects: 100% (6/6), 449 bytes, done.
Total 6 (delta 0), reused 0 (delta 0)
To git@github.com:mjhea0/git-commands.git
* [new branch]      master -> master
```

Success! Take a look at my remote [repo](https://github.com/mjhea0/git-commands) on Github, which has identical copies of my files from my local working directory and repository.

## Maintaining

The more you work with Git - or any version control system, for that matter - the less you'll spend simply taking (`git add .`) and saving (`git commit`) snapshots. Maintaining (both local and remote) and ensuring your local and remote repositories stay in sync can be incredibly time consuming.

This section could easily be split into multiple sections, with five ot ten commands each. However, most readers will follow a pretty straight forward workflow of initializing, staging, and then committing, without having to stray too far into maintenance.

- `git pull origin master` literally pulls the changes made from a remote repository to your local repository. Perhaps you are collaborating on a project and need to pull changes down made by your collaborators or maybe you're just working solo and updating a local repository on different computer.

To demonstrate a basic pull, I made changes to the "readme.md" files on the remote repository. I want those changes to reflect locally, so I can simply pull them down.

``` sh
$ git pull origin master
remote: Counting objects: 5, done.
remote: Compressing objects: 100% (3/3), done.
remote: Total 3 (delta 0), reused 0 (delta 0)
Unpacking objects: 100% (3/3), done.
From github.com:mjhea0/git-commands
 * branch            master     -> FETCH_HEAD
Updating 93127ee..15f4b6c
Fast-forward
 readme.md | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
```

> You may have heard of the `fetch` and/or `merge` commands. Well, the `pull` command literally is a combination of both those commands. In essence, you are first "fetching" all the changes, then "merging" those changes. In the example above, I fetched the changes made to "readme.md", then merged the two files. Keep in mind that most merge situations are never this simple, and problems can arise in the merge process, which can be difficult to solve.

In the example, I changed the text within "test.md" both locally and remotely:
- Local: "testing merge"
- Remote: "merging test"

If I just try to `push` or `pull` like normal, I will run into errors:

``` sh
$ git pull origin master
remote: Counting objects: 5, done.
remote: Compressing objects: 100% (2/2), done.
remote: Total 3 (delta 0), reused 0 (delta 0)
Unpacking objects: 100% (3/3), done.
From github.com:mjhea0/git-commands
 * branch            master     -> FETCH_HEAD
Updating 15f4b6c..30b7818
error: Your local changes to the following files would be overwritten by merge: test.md
Please, commit your changes or stash them before you can merge.
Aborting

$ git push origin master
To git@github.com:mjhea0/git-commands.git
! [rejected]        master -> master (non-fast-forward)
error: failed to push some refs to 'git@github.com:mjhea0/git-commands.git'
hint: Updates were rejected because the tip of your current branch is behind
hint: its remote counterpart. Merge the remote changes (e.g. 'git pull')
hint: before pushing again.
hint: See the 'Note about fast-forwards' in 'git push --help' for details.
```

So neither command worked. You can see in the stack trace some helpful hints. Basically, I can do a fast forward in either direction (PUSH or PULL), which forces the changes by adding an `-f` to the end of either command:

``` sh
$ git push origin master -f
Total 0 (delta 0), reused 0 (delta 0)
To git@github.com:mjhea0/git-commands.git
+ 30b7818...15f4b6c master -> master (forced update)
```

In small, trivial situations, it's perfectly fine to use this method of merging. However, when you are dealing with complex code, you will definitely want to take a different approach - which will be covered next time.

- `git log` is used to view the history of your repository.

``` sh
$ git log
commit 15f4b6c44b3c8924caabfac9e4be11946e72acfb
Author: Michael Herman <hermanmu@gmail.com>
Date:   Thu Oct 10 22:56:30 2013 -0600

    Update readme.md

commit 93127eed8fa0c3b4df7bbdabd7d6aefa312c31a3
Author: Michael Herman <hermanmu@gmail.com>
Date:   Thu Oct 10 22:45:14 2013 -0600

   initial commit
```

Here we can see the local commits, along with the commit number, author info, date, and the note from the commit - which is exactly why it's good to use detailed messages with your commits.

- `git reset --hard <commit number>` is used for reverting back to a particular commit. Check the logs to find the commit number you want to revert back to. If you ever submit code that breaks other code (which will happen), use this command to discard that commit and roll back the entire repository to the commit you specify. Continuing with the snapshot analogy, perhaps you took and then saved three bad pictures of yourself. Well, you can use this command to discard those pictures.

So I went ahead and made another change to "readme.md" and committed the files locally. I now have three commits according to the log:

``` sh
$ git log
commit 0f3165bf69b3d508431fa2fe2d5a0b8013637fd2
Author: Michael Herman <hermanmu@gmail.com>
Date:   Thu Oct 10 23:38:42 2013 -0600

    another update to readme.md

commit 15f4b6c44b3c8924caabfac9e4be11946e72acfb
Author: Michael Herman <hermanmu@gmail.com>
Date:   Thu Oct 10 22:56:30 2013 -0600

    Update readme.md

commit 93127eed8fa0c3b4df7bbdabd7d6aefa312c31a3
Author: Michael Herman <hermanmu@gmail.com>
Date:   Thu Oct 10 22:45:14 2013 -0600

   initial commit
```

Let's say I made that last commit on accident. How do I correct?

``` sh
$ git reset --hard 15f4b6c44b3c8924caabfac9e4be11946e72acfb
HEAD is now at 15f4b6c Update readme.md
```

By using the 'reset' command I completely discarded the changes from the last commit. The file even reverted back. It's like the changes never happened:

``` sh
$ git log
commit 15f4b6c44b3c8924caabfac9e4be11946e72acfb
Author: Michael Herman <hermanmu@gmail.com>
Date:   Thu Oct 10 22:56:30 2013 -0600

    Update readme.md

commit 93127eed8fa0c3b4df7bbdabd7d6aefa312c31a3
Author: Michael Herman <hermanmu@gmail.com>
Date:   Thu Oct 10 22:45:14 2013 -0600

   initial commit
```

Back to the previous state. Yay!

<br>

Again, these are the basic commands - and the commands that I use the most. Next time we'll go over some of the more advanced commands and I'll detail a workflow you can follow for when you work with more than one person on a single project. Cheers!