var wrench = require('wrench');

module.exports = function(grunt){
  grunt.loadNpmTasks('grunt-contrib-compress');

  grunt.registerTask('build', function(){
    grunt.log.writeln('building Github PR Sanity');

    wrench.copyDirSyncRecursive('./chrome', './pr-sanity', {
      forceDelete: true,
      preserveFiles: false
    });
    grunt.log.writeln('Compressing build');
    grunt.task.run('compress');

    grunt.log.writeln('cleaning up');
    wrench.rmdirSyncRecursive('./pr-sanity');
  });

  grunt.initConfig({
    compress: {
      main: {
        options: {
          archive: 'pr-sanity.zip',
          mode: 'zip'
        },
        files: [
          {src: ['pr-sanity/**'], dest: './'}
        ]
      }
    }
  });
}
