require "bundler/setup"
Bundler.setup
require "sinatra/base"

class Pof < Sinatra::Base

  run! if app_file == $0
end
