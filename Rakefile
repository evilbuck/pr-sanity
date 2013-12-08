require "open3"
require "fileutils"
require "zip"

APP_PATH = File.dirname(__FILE__)
COMPILE_PATH = File.join(APP_PATH, "pr-sanity")
LIB_PATH = File.join(APP_PATH, "lib")
ZIP_FILE_NAME = File.join(COMPILE_PATH + ".zip")

namespace :extension do
  desc "build extension, compile javascript files using closure"
  task :build do
    FileUtils.rm_rf( COMPILE_PATH ) if File.exists? File.join( COMPILE_PATH )
    FileUtils.cp_r( File.join(APP_PATH, "chrome"), COMPILE_PATH )

    # get the list of js files
    Dir[File.join(File.dirname(__FILE__), "chrome", "*.js")].each do |path|
      file = File.basename( path )
      next if file == 'jquery.js'
      new_path = File.join( COMPILE_PATH, file )
      stdin, stdout, stderr = Open3.popen3("/usr/bin/java -jar #{File.join(LIB_PATH, "compiler.jar")} --js #{path} --js_output_file #{new_path}")
      puts "finished compiling #{file}"
    end

    # Zip the files
    puts "zipping the files"
    FileUtils.rm_rf(ZIP_FILE_NAME) if File.exists? ZIP_FILE_NAME
    Zip::File.open(ZIP_FILE_NAME, Zip::File::CREATE) do |zipfile|
      Dir[File.join(COMPILE_PATH, '**', '**')].each do |file|
        zipfile.add(file.sub(COMPILE_PATH + '/', ''), file)
      end
    end
  end
end

begin
  require 'jasmine'
  load 'jasmine/tasks/jasmine.rake'
rescue LoadError
  task :jasmine do
    abort "Jasmine is not available. In order to run jasmine, you must: (sudo) gem install jasmine"
  end
end
