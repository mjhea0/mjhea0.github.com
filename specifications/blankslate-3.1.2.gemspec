# -*- encoding: utf-8 -*-

Gem::Specification.new do |s|
  s.name = "blankslate"
  s.version = "3.1.2"

  s.required_rubygems_version = Gem::Requirement.new(">= 0") if s.respond_to? :required_rubygems_version=
  s.authors = ["Jim Weirich"]
  s.date = "2012-09-07"
  s.description = "BlankSlate provides a base class where almost all of the methods from Object and\nKernel have been removed.  This is useful when providing proxy object and other\nclasses that make heavy use of method_missing.\n"
  s.email = "jim.weirich@gmail.com"
  s.extra_rdoc_files = ["CHANGES", "MIT-LICENSE", "Rakefile", "README.rdoc", "doc/releases/builder-1.2.4.rdoc", "doc/releases/builder-2.0.0.rdoc", "doc/releases/builder-2.1.1.rdoc"]
  s.files = ["CHANGES", "MIT-LICENSE", "Rakefile", "README.rdoc", "doc/releases/builder-1.2.4.rdoc", "doc/releases/builder-2.0.0.rdoc", "doc/releases/builder-2.1.1.rdoc"]
  s.homepage = "http://onestepback.org"
  s.licenses = ["MIT"]
  s.rdoc_options = ["--title", "BlankSlate -- Base Class for building proxies.", "--main", "README.rdoc", "--line-numbers"]
  s.require_paths = ["lib"]
  s.rubygems_version = "1.8.23"
  s.summary = "Blank Slate base class."

  if s.respond_to? :specification_version then
    s.specification_version = 3

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
    else
    end
  else
  end
end
