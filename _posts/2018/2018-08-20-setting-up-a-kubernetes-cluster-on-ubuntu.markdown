---
layout: post
title: "Setting Up a Kubernetes Cluster on Ubuntu 18.04"
date: 2018-08-20
last_modified_at: 2018-08-20
comments: true
toc: true
categories: [kubernetes, docker]
keywords: "kubernetes, docker"
description: "This tutorial demonstrates how to spin up a Kubernetes cluster on Ubuntu 18.04."
redirect_from:
  - /blog/2018/08/20/setting-up-a-kubernetes-cluster-on-ubuntu/
---

In this tutorial, we'll spin up a Kubernetes cluster on Ubuntu 18.04.

> This guide uses Ubuntu 18.04 droplets on [DigitalOcean](https://m.do.co/c/d8f211a4b4c2). Feel free to swap out DigitalOcean for a different cloud hosting provider or your own on-premise environment.

*Dependencies*:

1. Docker v18.06.0-ce
1. Kubernetes v1.11.2

{% if page.toc %}
{% include contents.html %}
{% endif %}

## Provision the Machines

Following along with the DigitalOcean example?

1. [Sign up](https://m.do.co/c/d8f211a4b4c2) for an account (if you don’t already have one).
1. [Generate](https://www.digitalocean.com/community/tutorials/how-to-use-the-digitalocean-api-v2) an access token so you can access the DigitalOcean API.
1. Spin up three new [droplets](https://www.digitalocean.com/pricing/) (one master and two workers) that have 4 GB of memory and 2 vCPUs either from the DigitalOcean console or [doctl](https://github.com/digitalocean/doctl), the DigitalOcean.

`doctl` example:

```sh
# authenticate
$ doctl auth init

# spin up the droplets
$ for i in 1 2 3; do
    doctl compute droplet create \
      node-$i \
      --region nyc1 \
      --image ubuntu-18-04-x64 \
      --size 4gb
done
```

Wait a few seconds for the droplets to spin up, and then run:

```sh
$ doctl compute droplet list
```

You should see something like:

```
ID         Name    Public IPv4     Memory  VCPUs  Disk  Region  Image             Status
106096338  node-1  142.93.198.67   4096    2      60    nyc1    Ubuntu 18.04 x64  active
106096340  node-2  142.93.198.167  4096    2      60    nyc1    Ubuntu 18.04 x64  active
106096345  node-3  142.93.206.39   4096    2      60    nyc1    Ubuntu 18.04 x64  active
```

Take note of the public IP addresses.

> Refer to the [How To Use Doctl](https://www.digitalocean.com/community/tutorials/how-to-use-doctl-the-official-digitalocean-command-line-client) guide for more info on using the `doctl` CLI tool.

## Configure the Master Node

SSH into the machine that will serve as the Kubernetes [master](https://kubernetes.io/docs/concepts/overview/components/#master-components), and then run the following commands...

### Install Dependencies

Install Docker along with-

1. [kubeadm](https://kubernetes.io/docs/setup/independent/create-cluster-kubeadm/) - bootstraps a Kubernetes cluster
1. [kubelet](https://kubernetes.io/docs/reference/generated/kubelet/) - configures containers to run on a host
1. [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) - deploys and manages apps on Kubernetes

```sh
$ apt-get update && apt-get install -y apt-transport-https
$ curl -s https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
$ add-apt-repository \
    "deb [arch=amd64] https://download.docker.com/linux/ubuntu bionic stable"
$ apt update && apt install -qy docker-ce
$ curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -
$ echo "deb http://apt.kubernetes.io/ kubernetes-xenial main" \
    > /etc/apt/sources.list.d/kubernetes.list
$ apt-get update && apt-get install -y kubeadm kubelet kubectl
```

> As of writing, Kubernetes for Ubuntu 18.04 (Bionic) is not yet available, but Ubuntu 16.04 (Xenial) works just fine. Also, Kubernetes 1.11 does *not* officially [support](https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG/CHANGELOG-1.11.md#external-dependencies) Docker 18.06. It should work fine, but it could bring up some unexpected issues.

### Configure Kubernetes

Init Kubernetes:

```sh
$ kubeadm init --apiserver-advertise-address=<MASTER_IP> --pod-network-cidr=192.168.1.0/16
```

> Be sure to replace `<MASTER_IP>` with the machine's IP address.

Take note of the join token command. For example:

```sh
kubeadm join 142.93.198.67:6443 \
  --token 58f5m6.rms4ycepgmtvjl9z --discovery-token-ca-cert-hash sha256:<hash>
```

Then, create a new user:

```sh
$ adduser michael
$ usermod -aG sudo michael
$ su - michael
```

Set up the Kubernetes config as the user you created:

```sh
$ mkdir -p $HOME/.kube
$ sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
$ sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

Again, as the new user, deploy a [flannel](https://github.com/coreos/flannel) network to the cluster:

```sh
$ kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
```

## Configure the Worker Nodes

The following commands should be run on each of the worker machines.

### Install Dependencies

Again, install Docker, kubeadm, kubelet, and kubectl:

```sh
$ apt-get update && apt-get install -y apt-transport-https
$ curl -s https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
$ add-apt-repository \
    "deb [arch=amd64] https://download.docker.com/linux/ubuntu bionic stable"
$ apt update && apt install -qy docker-ce
$ curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -
$ echo "deb http://apt.kubernetes.io/ kubernetes-xenial main" \
    > /etc/apt/sources.list.d/kubernetes.list
$ apt-get update && apt-get install -y kubeadm kubelet kubectl
```

### Configure Kubernetes

Using the join command from above, join the worker to the cluster.

## Sanity Check

Back on the master node, run the following command as the user you created:

```sh
$ kubectl get nodes
```

You should see something similar to:

```sh
NAME      STATUS    ROLES     AGE       VERSION
node-1    Ready     master    28m       v1.11.2
node-2    Ready     <none>    3m        v1.11.2
node-3    Ready     <none>    35s       v1.11.2
```

Remove the droplets once done:

```sh
$ for i in 1 2 3; do
    doctl compute droplet delete node-$i
done
```

<hr>

That's it!

> Want to automate this process? Check out [Creating a Kubernetes Cluster on DigitalOcean with Python and Fabric](https://testdriven.io/creating-a-kubernetes-cluster-on-digitalocean).
