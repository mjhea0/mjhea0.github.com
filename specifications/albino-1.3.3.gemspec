# -*- encoding: utf-8 -*-

Gem::Specification.new do |s|
  s.name = "albino"
  s.version = "1.3.3"

  s.required_rubygems_version = Gem::Requirement.new(">= 0") if s.respond_to? :required_rubygems_version=
  s.authors = ["Chris Wanstrath"]
  s.date = "2011-04-19"
  s.description = "Ruby wrapper for pygmentize."
  s.email = "chris@wanstrath.com"
  s.homepage = "http://github.com/github/albino"
  s.require_paths = ["lib"]
  s.rubyforge_project = "albino"
  s.rubygems_version = "1.8.23"
  s.summary = "Ruby wrapper for pygmentize."

  if s.respond_to? :specification_version then
    s.specification_version = 2

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_runtime_dependency(%q<posix-spawn>, [">= 0.3.6"])
      s.add_development_dependency(%q<mocha>, [">= 0"])
    else
      s.add_dependency(%q<posix-spawn>, [">= 0.3.6"])
      s.add_dependency(%q<mocha>, [">= 0"])
    end
  else
    s.add_dependency(%q<posix-spawn>, [">= 0.3.6"])
    s.add_dependency(%q<mocha>, [">= 0"])
  end
end
