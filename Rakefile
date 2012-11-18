require "open3"
require "fileutils"
require "zip/zip"

APP_PATH = File.dirname(__FILE__)
COMPILE_PATH = File.join(APP_PATH, "compiled_chrome")
LIB_PATH = File.join(APP_PATH, "lib")

namespace :extension do
  desc "build extension, compile javascript files using closure"
  task :build do
    FileUtils.rm_rf( COMPILE_PATH ) if File.exists? File.join( COMPILE_PATH )
    FileUtils.cp_r( File.join(APP_PATH, "chrome"), COMPILE_PATH )

    # get the list of js files
    Dir[File.join(File.dirname(__FILE__), "chrome", "*.js")].each do |path|
      file = File.basename( path )
      new_path = File.join( COMPILE_PATH, file )
      stdin, stdout, stderr = Open3.popen3("/usr/bin/java -jar #{File.join(LIB_PATH, "compiler.jar")} --js #{path} --js_output_file #{new_path}")
      #puts stdout.gets
      #puts stderr.gets
      puts "finished compiling #{file}"
    end

    # delete zip file if exists
    zip_file = File.join(APP_PATH, "chrome.zip")
    File.delete( zip_file ) if File.exists?( zip_file )
    # create new zip file
    zip = Zip::ZipFile.open( File.join(APP_PATH, "chrome.zip"), Zip::ZipFile::CREATE )
    Dir[ File.join(COMPILE_PATH, "*") ].each do |file|
      zip.add(File.basename(file), file)
    end
    zip.close

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
