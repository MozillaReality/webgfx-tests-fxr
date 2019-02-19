#!/usr/bin/env node
var program = require('commander');
const shell = require('shelljs');
const chalk = require('chalk');
const spawnSync = require('child_process').spawnSync;
const packageInfo = require('../package.json');

function ucFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

program
  .version(packageInfo.version);

program
  .command('run')
  //.description('Generate a summary from JSON results')
  .option("-b, --branch [branchlist...]", "Branc list", "master")
  .option("-a, --arch <arch>", "Architecture: 32, 64, all", "32")
  .option("-t, --target <target platform list>", "Target: oculus, google, wave", "oculus")
  .option("-m, --mode <debug or release>", "Valid options: release, debug, all", "release")
  .option("-v, --verbose", "Show all the information available")
  .action(options => {
    var branches = options.branch.split(',');
    var shellOptions = {silent: !options.verbose};

    var archs = options.arch === 'all' ? ['32', '64'] : [options.arch];
    var modes = options.mode === 'all' ? ['release', 'debug'] : [options.mode];
    var targets = options.target.split(',');
    
    var targetConfigs = [];

    targets.forEach(target => {
      archs.forEach(arch => {
        modes.forEach(mode => {
          if (arch === '32') arch = '';
          var targetConfig = ucFirst(target) + 'vr' + 'Arm' + arch + ucFirst(mode);
          targetConfigs.push({
            target: target,
            arch: arch,
            mode: mode,
            config: targetConfig
          });
        });
      });
    });

    console.log(`Target configurations to build (${chalk.yellow(targetConfigs.length)}):`);
    targetConfigs.forEach(targetConfig => console.log(' - ' + chalk.blueBright(targetConfig.config)));

    branches.forEach(branch => {
      //shell.cd('~/code/FirefoxReality');
      targetConfigs.forEach(targetConfig => {
        console.log(`Compiling Firefox Reality for target: ${chalk.yellow(targetConfig.config)} on branch ${chalk.yellow(branch)}`);
        output = shell.exec(`git checkout ${branch}`, shellOptions).stdout.trim();
        //output = shell.exec(`./gradlew assemble${targetConfig}`, shellOptions).stdout.trim();
        if (true || output.indexOf('BUILD SUCCESSFUL')!== -1) {
          console.log(`* Compile: ${chalk.green('Succesful')}`);
          //shell.cd('tools/tests');
          console.log(`\n${chalk.green('Executing test on generated apk')}`);
          //node ../src/main/index.js run misc_fps,instancing --package ./master.apk,cpu_cores.apk --adb --info @oculus_godddd
          //output = shell.exec(`webgfx-tests run misc_fps,instancing --package ~/code/FirefoxReality/app/build/outputs/apk/oculusvrArm/debug/FirefoxReality-oculusvr-arm-debug.apk --adb`, shellOptions).stdout.trim();
          //output = shell.exec(`node ../src/main/index.js run misc_fps,instancing --package ~/code/FirefoxReality/app/build/outputs/apk/oculusvrArm/debug/FirefoxReality-oculusvr-arm-debug.apk --adb --info git@${branch}`, shellOptions).stdout.trim();
          var baseApkFolder = "app/build/outputs/apk";
          var folder = `${baseApkFolder}/${targetConfig.target}vrArm${targetConfig.arch}/${targetConfig.mode}/`;
          var apkName = `FirefoxReality-${targetConfig.target}vr-arm${targetConfig.arch}-${targetConfig.mode}${targetConfig.mode === 'release' ? '-unsigned' : ''}.apk`;
          var pathApk = folder + apkName;
          console.log(pathApk);
          spawnSync('webgfx-tests', [`run misc_fps,instancing -c tools/tests --package ${pathApk} --adb --info git@${branch} --outputfile /tmp/${branch}-${targetConfig.config}.json`], { shell: true, stdio: 'inherit' });
      
          shellOptions = {silent: true};
        } else {
          console.log('ERRRORRRR', output);
        }          
      });
    });
    
    var files = [];
    branches.forEach(branch => {
      targetConfigs.forEach(targetConfig => {
        files.push(`/tmp/${branch}-${targetConfig.config}.json`);
      });
    });
    spawnSync('webgfx-tests', [`summary ${files.join(' ')} --groupby file`], { shell: true, stdio: 'inherit' });    
  });

  
program.parse(process.argv);

if (program.args.length === 0) {
  program.help();
}

/*
  --branch branch1 branch2
  --target google oculus
  --arch all
*/

/*
tests --branches master oculus_cpu --target google, oculus --arch 64/32
master google/oculus 64
oculus_cpu google/oculus 64
*/

/*
assembleOculusvrArmDebug
assembleOculusvrArm64Debug

assembleOculusvrArmDebug
*/
