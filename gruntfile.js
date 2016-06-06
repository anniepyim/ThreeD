/* This is Grunt's config file. All pipeline stuff goes here */
module.exports = function(grunt) {
    
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            files: ['gruntfile.js', 'index.js', 'js/**/*.js'],
            options: {
                // options here to override JSHint defaults
                globals: {
                    console: true,
                    module: true,
                    document: true
                }
            }
        },
        browserify: {
            'dist/js/Test.js': ['index.js']
        },
        uglify: {
            my_target: {
                files: {
                    'dist/js/Test.min.js': ['dist/js/Test.js']
                }
            }
        },
        watch: {
          scripts: {
            files: ['index.js', '**/*.js','dist/*','js/*'],
            tasks: ['jshint', 'browserify', 'uglify'],
            options: {
              spawn: false,
            },
          },
        }
    });
    
    //Tasks
    grunt.registerTask('dist', ['jshint', 'browserify', 'uglify']); //Generates dist folder
    
    // Load the plugins
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    
    //Watchify
    grunt.loadNpmTasks('grunt-contrib-watch');
    
};
                     
        