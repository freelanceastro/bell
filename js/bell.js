// (c) Adam Becker, 2018. MIT license.

// This is where the heart of the Bell's theorem interactive lives.

  ///////////////////////////////////////
 //       INITIALIZATION              //
///////////////////////////////////////

// A polyfill for Object.assign, so IE can hang with the cool kids.
// Taken from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
// if (typeof Object.assign != 'function') {
//   // Must be writable: true, enumerable: false, configurable: true
//   Object.defineProperty(Object, "assign", {
//     value: function assign(target, varArgs) { // .length of function is 2
//       'use strict';
//       if (target == null) { // TypeError if undefined or null
//         throw new TypeError('Cannot convert undefined or null to object');
//       }

//       var to = Object(target);

//       for (var index = 1; index < arguments.length; index++) {
//         var nextSource = arguments[index];

//         if (nextSource != null) { // Skip over if undefined or null
//           for (var nextKey in nextSource) {
//             // Avoid bugs when hasOwnProperty is shadowed
//             if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
//               to[nextKey] = nextSource[nextKey];
//             }
//           }
//         }
//       }
//       return to;
//     },
//     writable: true,
//     configurable: true
//   });
// }

// OK, first we need to wrap everything in this magic jQuery function, 
// to make sure nothing happens before the various Javascript packages load. 
// This is jQuery's .ready() function, with the preferred syntax where the word "ready" doesn't actually appear.
// jQuery is weird.
$(function(){

  // // Make sure the page doesn't remember scroll position on reload.
  // // This might not work in all browsers; look into this.
  // // But it should work in FF, Chrome, and Safari. Not sure about mobile browsers, or IE/Edge (though who cares about the latter).
  // $(window).scrollTop(0);
  // // For Chrome and maybe Safari:
  // $(window).bind("beforeunload", (function() {
  //     $('html,body').scrollTop(0);
  //     // console.log("test beforeunload");
  // }));

  // Create some global variables describing the size of our canvas.
  var xbox = 400, ybox = 200;
  var center_x = xbox/2, center_y = ybox/2;

  // Create an SVG canvas. This is just where the casino definitions will live, so it won't have anything visible in it.
  // We'll put it in a background div at the top of the page with zero opacity and negative z-index.
  // It still needs to have a non-zero viewBox, though, otherwise there are bugs I don't understand. 
  // And if we turn off preserveAspectRatio, something could go wrong with the responsive design, 
  // though I think it's unlikely since the later canvases all preserve this too.
  var canvas = SVG("casino-defs").attr({viewBox: '0 0 ' + String(xbox) + ' ' + String(ybox), preserveAspectRatio: 'xMinYMin meet'});

  // Create containers for our external SVG components inside the definitions.
  // The SVG definitions are are basically a container that makes anything inside invisible.
  // That's useful, because we'll want to make copies of these things, and make each copy do different things without altering the masters.
  var definitions = canvas.defs();
  var dwheel = definitions.group().id("dwheel");
  var dmachine = definitions.group().id('dmachine');
  var dselector = definitions.group().id('dselector');
  var dpointer = definitions.group().id('dpointer');

  // This is a gradient, which we'll need to color the roulette balls.
  var ball_gradient = definitions.gradient('radial', function(stop){
    stop.at(0, "white");
    stop.at(1, "gray");
  });
  ball_gradient.id('ball_gradient');
  ball_gradient.attr({cx:0.35, cy:0.35});
  ball_gradient.radius(0.25);

  // This is the callback function, where all the actual stuff we want to do will live. Over 90% of the code will be here.
  // This function will get called only when all the external SVG stuff has been loaded in.
  var load_callback = function(){

    ///////////////////////////////////////////////////////////
    //       POSITIONING COMPONENTS AND BUILDING WHEELS      //
    ///////////////////////////////////////////////////////////

    // We need to get the centers of the objects to be able to place them correctly.
    // First, the wheel.
    var wheel_circles = $("#dwheel circle");
    var wheel_x = wheel_circles.attr('cx'), wheel_y = wheel_circles.attr('cy');

    // We need to center this now, before we define the individual wheels.
    dwheel.translate(-wheel_x, -wheel_y);

    // Now that we have the position of the wheel, we can build six copies of it, put hubs in them, and label the hubs.
    // var dwheelA1 = definitions.group().id('dwheelA1');
    // var dwheelA1 = definitions.group().addClass('wheel');
    var dwheel1 = definitions.group().addClass('wheel');
    // var dwheel2 = definitions.group().id("dwheel2");
    // var dwheel3 = definitions.group().id('dwheel3');
    // dwheelA1.use(dwheel);
    dwheel1.use(dwheel);
    // dwheel2.use(dwheel);
    // dwheel3.use(dwheel);
    var hub_radius = 7.8; // took this from the original SVG file
    // dwheelA1.circle().radius(hub_radius).center(wheel_x, wheel_y).addClass("center-circle");
    // var dwheelA2 = dwheelA1.clone();//.id('dwheelA2');
    // var dwheelA3 = dwheelA1.clone();//.id('dwheelA3');
    // dwheel1.circle().radius(hub_radius).center(wheel_x, wheel_y).addClass("center-circle");
    dwheel1.circle().radius(hub_radius).center(0, 0).addClass("center-circle");
    var dwheel2 = dwheel1.clone();//.id('dwheelA2');
    var dwheel3 = dwheel1.clone();//.id('dwheelA3');

    // Have to animate the text to the correct y-position because otherwise Firefox on OSX doesn't center it properly.
    // No idea why, but this solution works without ruining centering in other browsers where it behaves correctly.
    // dwheelA1.text('1').addClass('wheel-label').x(wheel_x).cy(wheel_y).animate(0).cy(wheel_y);
    // dwheelA2.text('2').addClass('wheel-label').x(wheel_x).cy(wheel_y).animate(0).cy(wheel_y);
    // dwheelA3.text('3').addClass('wheel-label').x(wheel_x).cy(wheel_y).animate(0).cy(wheel_y);
    dwheel1.text('1').addClass('wheel-label').x(0).cy(0).animate(0).cy(0);
    dwheel2.text('2').addClass('wheel-label').x(0).cy(0).animate(0).cy(0);
    dwheel3.text('3').addClass('wheel-label').x(0).cy(0).animate(0).cy(0);

    // Next, the pointer.
    var pointer_circles = $('#dpointer circle');
    var pointer_x = pointer_circles.attr('cx'), pointer_y = pointer_circles.attr('cy');

    // Next, the selector.
    var selector_circles = $('#dselector circle');
    var selector_x = selector_circles.attr('cx'), selector_y = selector_circles.attr('cy');

    // Finally, the fancy machine.
    var machine_box = $('#dmachine rect');
    var machine_box_width = parseFloat(machine_box.attr('width'));
    var machine_box_height = parseFloat(machine_box.attr('height'));
    var machine_x = String(parseFloat(machine_box.attr('x')) + machine_box_width/2);
    var machine_y = String(parseFloat(machine_box.attr('y')) + machine_box_height/2);

    // Now, center all the invisible components on the origin, to make it easy to transform the copies of them we're going to make.
    // dwheelA1.translate(-wheel_x, -wheel_y);
    // dwheelA2.translate(-wheel_x, -wheel_y);
    // dwheelA3.translate(-wheel_x, -wheel_y);
    // dwheel1.translate(-wheel_x, -wheel_y);
    // dwheel2.translate(-wheel_x, -wheel_y);
    // dwheel3.translate(-wheel_x, -wheel_y);
    dpointer.translate(-pointer_x, -pointer_y);
    dselector.translate(-selector_x, -selector_y);
    dmachine.translate(-machine_x, -machine_y);

    // // Finally, clone the A wheels to create the B wheels.
    // // We need separate B wheel definitions so we can select and style different wheels on each side.
    // var dwheelB1 = dwheelA1.clone();//.id('dwheelB1');
    // var dwheelB2 = dwheelA2.clone();//.id('dwheelB2');
    // var dwheelB3 = dwheelA3.clone();//.id('dwheelB3');

    // // Give all those wheels some damn class!
    // dwheelA1.addClass('wheelA1');
    // dwheelA2.addClass('wheelA2');
    // dwheelA3.addClass('wheelA3');
    // dwheelB1.addClass('wheelB1');
    // dwheelB2.addClass('wheelB2');
    // dwheelB3.addClass('wheelB3');
    dwheel1.addClass('wheel1');
    dwheel2.addClass('wheel2');
    dwheel3.addClass('wheel3');

    // dwheelB1.select('text').animate(0).cy(wheel_y);
    // dwheelB2.select('text').animate(0).cy(wheel_y);
    // dwheelB3.select('text').animate(0).cy(wheel_y);

    // //Let's create sets of the left-hand and right-hand wheels; it'll come in handy later.
    // var dwheelsA = definitions.set().add(dwheelA1, dwheelA2, dwheelA3);
    // var dwheelsB = definitions.set().add(dwheelB1, dwheelB2, dwheelB3);

    // // And make sure that wheel 2 starts out selected on both sides.
    // dwheelA2.select('.center-circle').addClass('selected');
    // dwheelB2.select('.center-circle').addClass('selected');

    //////////////////////////////////
    //     BUILDING THE CASINO      //
    //////////////////////////////////

    // We're going to make the casino a definition as well, so we can throw a copy of it out there whenever we need it.
    var dcasino = definitions.group().id('dcasino').addClass('casino');
    // var gcasino = canvas.group().id('gcasino');

    // Define some variables related to the structure of this thing.
    var triple_wheel_x_offset = 133;
    var machine_y_offset = -42.983;
    // I want three wheels arranged in an equilateral triangle.
    // Trig to the rescue!
    var yleg = 22.431; // This controls the spacing between the three wheels. Don't touch the two variables below this, they're just trig.
    var hyp = 2*yleg;
    var xleg = 1.732*yleg; // 1.732 = sqrt(3), pretty much.

    // First the balls (i.e. photons). They need to be here because we want them underneath everything.
    var photon_radius = 1.9;
    var ball_y_offset = -0.325
    var Aball = dcasino.circle().radius(photon_radius);//.id("Aball");
    Aball.addClass('photon');
    var Bball= Aball.clone()//.id('Bball')
    Aball.center(-machine_box_width/2 + photon_radius, machine_y_offset + ball_y_offset);
    Bball.center(machine_box_width/2 - photon_radius, machine_y_offset + ball_y_offset);

    // Then the machine.
    var cmachine = dcasino.use(dmachine);

    // Left-hand triple-wheel construct.
    // Need to insert an invisible ball here for later use, 
    // to appear under the selector and over the wheels, 
    // because SVG 1.1 doesn't have a z-axis attribute for components! 
    // Astonishingly dumb.
    // CORRECTION: SVG.js lets you manipulate the z-axis of SVG components easily!
    // But it's still much easier to do this with a ball hidden here, and it doesn't exactly cost us much.
    // var c3wheelA = dcasino.group().id("c3wheelA");
    // c3wheelA.use(dwheelA1).translate(0, -hyp).id('wheelA1').addClass('wheel');
    // c3wheelA.use(dwheelA2).translate(-xleg, yleg).id('wheelA2').addClass('wheel');
    // c3wheelA.use(dwheelA3).translate(xleg, yleg).id('wheelA3').addClass('wheel');
    // var Aball_prime = Aball.clone(c3wheelA).center(0, 0);//.id("Aball_prime");
    // c3wheelA.use(dselector);
    // var cpointerA = c3wheelA.use(dpointer).id('cpointerA').addClass('pointer');
    var dc3wheelA = dcasino.group()//.addClass("c3wheelA");
    dwheel1.clone(dc3wheelA).translate(0, -hyp);//.addClass('wheel1');
    dwheel2.clone(dc3wheelA).translate(-xleg, yleg);//.addClass('wheel2');
    dwheel3.clone(dc3wheelA).translate(xleg, yleg);//.addClass('wheel3');
    // var Aball_prime = Aball.clone(c3wheelA).center(0, 0).addClass('prime-ball');//.id("Aball_prime");
    Aball.clone(dc3wheelA).center(0, 0).addClass('prime-ball');
    dc3wheelA.use(dselector);
    // var cpointerA = dpointer.clone(c3wheelA).addClass('pointer');
    dpointer.clone(dc3wheelA).addClass('pointer');

    var dc3wheelB = dc3wheelA.clone(dcasino);

    dc3wheelA.addClass('c3wheelA');
    dc3wheelB.addClass('c3wheelB');

    Aball.addClass('Aball');
    Bball.addClass('Bball');

    // Right-hand triple-wheel construct.
    // Can't just clone the left-hand one, since we're using the right-hand wheel definitions here.
    // var c3wheelB = dcasino.group().id("c3wheelB");
    // c3wheelB.use(dwheelB1).translate(0, -hyp).id('wheelB1').addClass('wheel');
    // c3wheelB.use(dwheelB2).translate(-xleg, yleg).id('wheelB2').addClass('wheel');
    // c3wheelB.use(dwheelB3).translate(xleg, yleg).id('wheelB3').addClass('wheel');
    // var Bball_prime = Bball.clone(c3wheelB).center(0, 0);//.id("Bball_prime");
    // c3wheelB.use(dselector);
    // var cpointerB = c3wheelB.use(dpointer).id('cpointerB').addClass('pointer');

    // Scale and position these things.
    cmachine.translate(0, machine_y_offset);
    dc3wheelA.translate(-triple_wheel_x_offset, 0);
    dc3wheelB.translate(triple_wheel_x_offset, 0);

    // Add in some labels.
    dcasino.text('You').addClass('svg-label').x(-triple_wheel_x_offset).cy(2.2*machine_y_offset);
    dcasino.text('Fatima').addClass('svg-label').x(triple_wheel_x_offset).cy(2.2*machine_y_offset);

    // And make sure that wheel 2 starts out selected on both sides.
    dcasino.select('.wheel2 > .center-circle').addClass('selected');
    // dcasino.get('wheelB2').select('.center-circle').addClass('selected');

    //////////////////////////////////
    //     ANIMATING THE CASINO     //
    //////////////////////////////////   

    // We need a boolean to indicate whether or not the casino is running, 
    // so we don't accidentally try to animate it when it's already running.
    // var CASINO_RUNNING = false;

    // Similarly, we need bools for the spinners, since those can move independently of the rest of the casino sometimes.
    // var spinnerA_rotating = false;
    // var spinnerB_rotating = false;

    // Sometimes, we'll be allowing the reader to control the spinners individually.
    // When we do, these are the variables that will carry the information about which wheel is selected on which side.
    // var i_wheelA = 2;
    // var i_wheelB = 2;

    // Create the animation path for the balls.
    // Pulled the following SVG straight from the original SVG file for the chutes coming off the machine, and then modified it slightly.
    var anipathA = dcasino.path('M17.7 96.4C20,95.2,75.5,66,79.3,64.2l0.6-0.3c5.4-2.6,12.7-6.2,24.9-6.4h11.4').id('anipathA');
    var apath_offset = 1.5;
    anipathA.addClass('animatepath');
    anipathA.dmove(-machine_x, machine_y_offset - machine_y + apath_offset);
    var pathlength = anipathA.length();
    // We don't need an animation path on the other side, because we're centered on the origin!
    // Just flip x-coordinates and we're good to go.

    // Next, create a default options object for the animation function.
    // I'm doing this because otherwise the functions themselves would have to take an inconveniently large number of arguments.
    // duration is the overall duration of the whole casino animation sequence in ms (not including the animation of the results updating),
    // with durations of the subsequences determined as a function of this parameter.
    // spinners_preset tells the casino whether the spinners are already at the correct settings, or if they need to be animated too.
    // display_results tells the casino whether the results should be logged on screen.
    // results_animation_duration says how long the animation of updating the results should take.
    // display_bell_stats tells the casino whether the fraction of runs with mismatched wheels that have matching colors should be displayed.
    // show_hidden_variables tells the casino whether to interrupt the ball release animation to display the hidden variables carried by the balls.
    // hidden_variables is the set of hidden variables (if any) that determine the outcomes.
    // n_repetitions is the number of times that the casino should repeat after the first time.
    // wheels_never_match tells the casino whether to ever allow the wheels to match if they're being selected randomly.
    var default_animation_options = {
      duration: 5000,
      spinners_preset: false,
      display_results: false,
      results_animation_duration: 750,
      display_bell_stats: false,
      display_hidden_variables: false,
      hidden_variables:{},
      n_repetitions:0,
      wheels_never_match:false
    };

    // Here's a little convenience function for creating new animation option objects.
    // Could probably do this with a class, but whatever.
    // This function takes an args object, which is empty by default.
    // If it's not empty, it needs to have some (but not all) of the properties of the default_animation_options object.
    // This function will return an object which is a copy of the default animation options object, 
    // but with the properties in args changed to their values in args.
    // So if you wanted an object with all the default animation options except display_results set to true,
    // you'd just say animation_options({display_results:true}) and you'd be set.
    var animation_options = function(args){
      var result = Object.assign({}, default_animation_options);
      // And, for a shining moment, JavaScript was Python. 
      // (This only works with enumerated properties of objects, don't try this elsewhere.)
      for (var prop in args){
        result[prop] = args[prop];
      }
      return result;
    };

    // Time for some animation functions!
    // Animate the balls coming out of the chutes.
    // They're always in pairs, so just do them both at once.
    // svg_canvas is the canvas that the balls live in.
    // duration is duration of the animation in ms.
    // display_hidden_variables is a boolean for interrupting the animation to show hidden variables.
    var ball_release = function(svg_canvas, duration, display_hidden_variables, hidden_variables){
      // First, find the two balls you need.
      var Aball = svg_canvas.select('.Aball').first();
      var Bball = svg_canvas.select('.Bball').first();
      // Then, create the 'tick' function for the animation.
      // position is a dummy variable that we'll increment over the course of the animation.
      // The other arguments are required by SVG.js, and are unimportant here.
      var animate_balls = function(position, morph, eased, situation){
        // Find the point at this length along the animation path.
        // We need to use 1-position, because it turns out the animation path is defined backwards (not a big deal, not worth fixing just for this)
        var location = anipathA.pointAt((1-eased)*pathlength);
        // Move the balls to that point and its reflection across the y-axis.
        Aball.center(location.x, location.y);
        Bball.center(-location.x, location.y); // centering everything on the origin was a *really* good idea.
      };
      // Finally, tell SVG.js to perform the animation.
      // We need a dummy thing to perform the "real" animation on, because SVG.js doesn't really support doing the kind of thing I want to do here.
      // But we can just create an invisible ball and move it across the screen, and that'll do the trick.
      // We also need to check whether to show hidden variables, and do it if we need to.
      svg_canvas.defs().rect(0,0).addClass('dummyrect').animate(duration, '<').move(100, 100)
        .during(animate_balls)
        .once(0.2, function(pos, eased){
          if (display_hidden_variables){
            pause_and_show_hidden_variables(svg_canvas, hidden_variables);
            }
          }, true)
        .after(function(){
          this.remove();
          }
        );
    };

    // We can do animation for everything else with fairly straightforward SVG animation commands, 
    // and it's all pretty intertwined from here on out, so let's put it all together.
    // This function runs the machine through the whole sequence once, 
    // from the balls rolling down the chutes to the final result of the run.
    // But this shouldn't be called directly, since the wheel selection and outcome should be random, or at least connected.
    // All that (along with ensuring Bell's inequality is violated) is handled by casino_run and casino_run_random, which are the functions you actually want to call.
    // The function is made to work with superdeterminism, clearly the correct model for making this work:
    // svg_canvas is the svg group containing the casino that this will run, and the object that contains the casino control variables.
    // i_wheelA and i_wheelB are the numbers of the wheels selected on the two sides of the experiment (A = left, B = right);
    // outcomeA and outcomeB are the outcomes selected on the two sides of the experiment, with 0 = black, 1 = red;
    // and options is the options object, as defined above in default_animation_options.
    var casino_run_raw = function(svg_canvas, i_wheelA, i_wheelB, outcomeA, outcomeB, options){

      /////////////
      //  SETUP  //
      /////////////

      // Before anything else: take the global bool CASINO_RUNNING and make it true.
      svg_canvas.data('CASINO_RUNNING', true);

      // Now, find the casino!
      // var casino = svg_canvas.select('.casino').first();

      // And find the triple-wheel constructs.
      var c3wheelA = svg_canvas.select('.c3wheelA').first();
      var c3wheelB = svg_canvas.select('.c3wheelB').first();

      // Turn off all result classes.
      // definitions.select('.center-circle').removeClass('result-black').removeClass('result-red');

      // Find our two wheels, they're gonna be the stars of the show.
      // var wheelA = SVG.get('wheelA' + i_wheelA);
      // var wheelB = SVG.get('wheelB' + i_wheelB);
      var wheelA = c3wheelA.select('.wheel' + i_wheelA).first();
      var wheelB = c3wheelB.select('.wheel' + i_wheelB).first();

      // // We need to know which definitions go with which wheel in order to find the right wheel hubs to select.
      // var dwheelA_id = '#dwheelA' + i_wheelA;
      // var dwheelB_id = '#dwheelB' + i_wheelB;



      // Find those balls.
      var Aball_prime = c3wheelA.select('.prime-ball').first();
      var Bball_prime = c3wheelB.select('.prime-ball').first();

      // And find those triple-wheel constructs

      // Now, reset the balls in the wheels back to their starting positions and rotations.
      Aball_prime.rotate(0, 0, 0);
      Aball_prime.translate(0, 0);
      Bball_prime.rotate(0, 0, 0);
      Bball_prime.translate(0, 0);
      // First, get the locations of the centers of the two wheels.
      // We need to rotate the balls around these points.
      // We'll also be using these points to translate the balls to the correct initial positions.
      var transA = wheelA.transform();
      var transB = wheelB.transform();
      var ballcenter_ratio = 4;
      // Now, grab the balls and put them where you want them.
      // But remember, these are the hidden balls sitting in each triple-wheel construct.
      // So they're already in there, sitting at the center of each of those constructs, under the hub.
      // You just need to translate them to the correct wheels *relative* to their current position.
      Aball_prime.center(transA.x/ballcenter_ratio, transA.y/ballcenter_ratio);
      Bball_prime.center(transB.x/ballcenter_ratio, transB.y/ballcenter_ratio);
      // Group the wheels with their balls, so we can spin them together.
      var groupA = c3wheelA.group().addClass('groupA');
      groupA.back();
      groupA.add(wheelA);
      groupA.add(Aball_prime);

      var groupB = c3wheelB.group().addClass('groupB');
      groupB.back();
      groupB.add(wheelB);
      groupB.add(Bball_prime);

      //////////////////////////////
      // ACTUALLY ANIMATING STUFF //
      //////////////////////////////

      // Release the balls.
      ball_release(svg_canvas, options.duration/2, options.display_hidden_variables, options.hidden_variables);

      // If the spinners haven't been preset, then while the balls are in flight, spin the pointers.
      if (!options.spinners_preset){
        svg_canvas.data('spinnerA_rotating', true);
        svg_canvas.data('spinnerB_rotating', true);
        var spinner_angleA = 120*Math.sign(Math.round(transA.x));
        var spinner_angleB = 120*Math.sign(Math.round(transB.x));
        // De-select all wheel hubs.
        svg_canvas.select('.center-circle').removeClass('selected');
        // Now animate the pointers, and make sure the right wheel hubs are selected when those animations complete.
        c3wheelA.select('.pointer').animate({duration:options.duration/4, ease:'>', delay: options.duration/12})
          .rotate(840 + spinner_angleA, pointer_x, pointer_y).after(function(){
              svg_canvas.data('spinnerA_rotating', false);
              wheelA.select('.center-circle').addClass('selected');
          });
        c3wheelB.select('.pointer').animate({duration:options.duration/4, ease:'>', delay: options.duration/12})
          .rotate(840 + spinner_angleB, pointer_x, pointer_y).after(function(){
              svg_canvas.data('spinnerB_rotating', false);
              wheelB.select('.center-circle').addClass('selected');
          });
      }
 
      //Once the balls have arrived, spin the balls around the centers of the wheels in a way that ensures they land on the correct color.
      var result_angleA = outcomeA*10 + transA.rotation;
      var result_angleB = outcomeB*10 + transB.rotation;

      Aball_prime.animate({duration:options.duration/2, ease:'>', delay: options.duration/2}).rotate(355 + result_angleA, transA.x, transA.y);
      // Aball_prime.animate({duration:options.duration/2, ease:'-', delay: options.duration/2}).rotate(350 + result_angleA, transA.x, transA.y);
      Bball_prime.animate({duration:options.duration/2, ease:'>', delay: options.duration/2}).rotate(355 + result_angleB, transB.x, transB.y)
      // Bball_prime.animate({duration:options.duration/2, ease:'-', delay: options.duration/2}).rotate(350 + result_angleB, transB.x, transB.y)
        .after(function(){
          // Update the results, if we're doing that.
          // We put this here so that we can easily interrupt it if we need to erase this casino mid-animation.
          // (We can stop the ball animations easily, but not the wheel-and-ball animations, since they do some important housekeeping at the end.)
          if (options.display_results){
            update_results(svg_canvas, i_wheelA, i_wheelB, outcomeA, outcomeB, options.results_animation_duration); 
          };
          // And update the bell stats, if we're doing that.
          if (options.display_bell_stats){
            update_bell_stats(svg_canvas, i_wheelA, i_wheelB, outcomeA, outcomeB);
          };
        });

      // We also need to spin the wheels with the balls in them, 
      // and we need to make sure they always end up in a spot visible to the reader (i.e. not under the hub).
      var rand_angleA = 270*Math.random() - transA.rotation;
      var rand_angleB = 270*Math.random() - transB.rotation;

      // Actually do the wheel + ball animations.
      // Once these animations finish, we need to get rid of the group we created for the wheel + ball pairs,
      // so we can set up for the next run without creating extra groups each time.
      groupA.animate({duration:options.duration/2, ease:'>', delay: options.duration/2}).rotate(765+rand_angleA, transA.x, transA.y)
        .afterAll(function(){
          // Aball_prime.animate({duration:options.duration/10, ease:'bounce'}).rotate(-5 + result_angleA, transA.x, transA.y).after(function(){
          //   wheelA.toParent(c3wheelA).back();
          //   Aball_prime.toParent(c3wheelA);
          //   wheelA.after(Aball_prime);
          //   groupA.remove();
          // });
          wheelA.toParent(c3wheelA).back();
          Aball_prime.toParent(c3wheelA);
          wheelA.after(Aball_prime);
          groupA.remove();
      });
      groupB.animate({duration:options.duration/2, ease:'>', delay: options.duration/2}).rotate(765+rand_angleB, transB.x, transB.y)
        .afterAll(function(){
          // Bball_prime.animate({duration:options.duration/10, ease:'bounce'}).rotate(-5 + result_angleB, transB.x, transB.y).after(function(){
            wheelB.toParent(c3wheelB).back();
            Bball_prime.toParent(c3wheelB);
            wheelB.after(Bball_prime);
            groupB.remove();
            // If the options call for repeating the casino run AND if the casino hasn't been shut down, 
            // run the casino again, and decrease the repetition counter by one.
            if (options.n_repetitions && svg_canvas.data('CASINO_RUNNING')){
              var rep_options = Object.assign({}, options);
              rep_options['n_repetitions'] = options.n_repetitions - 1;
              if ($.isEmptyObject(options.hidden_variables)){
                casino_run_random(svg_canvas, rep_options);
              }
              else{
                casino_run_random_with_hidden_variables(svg_canvas, options.hidden_variables, rep_options);
              }
            }
            else {
            // we need to turn off the lights before we leave the casino.
            svg_canvas.data('CASINO_RUNNING', false);
            svg_canvas.select('.run-button').removeClass('button-on')
            }
          // });
      });
    };

    // This stops any currently-running animations to the end and resets the casino to its starting values.
    // We need this function so we can refresh the casino when we scroll away.
    // var casino_stop_and_reset = function(){
    //   // First, see if the casino is currently running.
    //   if (svg_canvas.data('CASINO_RUNNING')){
    //     // Check to see if we're paused because of hidden variables, and if so, start this up again before stopping it,
    //     // because there's a bug that happens otherwise and I don't fully understand it.
    //     if (hv_pause){
    //       SVG.get('dummyrect').play();
    //       if (spinnerA_rotating){
    //         cpointerA.play();
    //       }
    //       if (spinnerB_rotating){
    //         cpointerB.play();
    //       }
    //       Aball_prime.play();
    //       Bball_prime.play();
    //       SVG.get('groupA').play();
    //       SVG.get('groupB').play();
    //       hv_pause = false;
    //     }
    //     // Then tell everyone that the casino is stopping!
    //     svg_canvas.data('CASINO_RUNNING', false);
    //     // Stop the balls rolling down the chutes and send them back from where they came.
    //     // $('#Aball').velocity('stop')
    //     // $('#Aball').velocity('reverse', {duration:0.001});
    //     // But remember, the dummy rectangle used for animation won't be there if the balls aren't moving.
    //     // So we need to enclose this in a try block.
    //     try{
    //       SVG.get('dummyrect').stop();
    //       SVG.get('dummyrect').remove();
    //     }
    //     catch(e){
    //       if (e instanceof TypeError){
    //         console.log(e);
    //       }
    //       else {
    //         throw e
    //       }
    //     }
    //     // Stop the spinners.
    //     cpointerA.stop();
    //     cpointerB.stop();
    //     // Stop the other balls if they're in the middle of their animation sequence around the wheels.
    //     Aball_prime.stop();
    //     Bball_prime.stop(false, true);
    //     // We want to fast-forward the wheel-and-ball assemblies, since they do some important resetting things at the end of their sequences.
    //     SVG.get('groupA').finish();
    //     SVG.get('groupB').finish();
    //   }
    //   // Next, see if either of the spinner selectors are spinning.
    //   if (spinnerA_rotating || spinnerB_rotating){
    //     cpointerA.stop();
    //     cpointerB.stop();
    //     spinnerA_rotating = false;
    //     spinnerB_rotating = false;
    //   }
    //   // Even if the casino and spinners aren't running, we need to reset it.
    //   // First, reset all the balls back to their starting positions and rotations.
    //   Aball.center(-machine_box_width/2 + photon_radius, machine_y_offset + ball_y_offset);
    //   Bball.center(machine_box_width/2 - photon_radius, machine_y_offset + ball_y_offset);
    //   Aball_prime.rotate(0, 0, 0);
    //   Aball_prime.translate(0, 0);
    //   Bball_prime.rotate(0, 0, 0);
    //   Bball_prime.translate(0, 0);
    //   // Set all six roulette wheels back to their initial rotations.
    //   SVG.select('.wheel').rotate(0);
    //   // And set the two spinners back to their initial rotations too.
    //   SVG.select('.pointer').rotate(0, 0, 0);
    //   // Speaking of spinners, we need to make sure the variables for the spinner control buttons are reset too.
    //   i_wheelA = 2;
    //   i_wheelB = 2;
    //   // And we need to make sure those wheels are the only ones that are selected.
    //   definitions.select('.center-circle').removeClass('selected');
    //   dwheelA2.select('.center-circle').addClass('selected');
    //   dwheelB2.select('.center-circle').addClass('selected');
    // };

    //////////////////////
    // QUANTUM PHYSICS! //
    //////////////////////

    // This is the master quantum casino animation function.
    // This function ensures that the quantum statistics hold and Bell's inequality is violated.
    var casino_run = function(svg_canvas, i_wheelA, i_wheelB, options){

      // First, figure out what the outcome of the left-hand wheel is.
      var outcomeA = Math.round(Math.random());
      // If both wheels are the same, outcome B must be the same as outcome A.
      // If the wheels aren't the same, then QM dictates that outcome B can only be the same as outcome A 25% of the time.
      if (i_wheelA === i_wheelB){
        var outcomeB = outcomeA;
      }
      else {
        var outcomeB = Math.random() <= 0.75 ? 1-outcomeA : outcomeA;
      }

      // Now actually do this animation.
      casino_run_raw(svg_canvas, i_wheelA, i_wheelB, outcomeA, outcomeB, options);
    };

    // Same as casino_run, but chooses the wheels randomly.
    // Call this enough times, and log the results, and you'll find that the quantum statistics hold and Bell's inequality is violated.
    var casino_run_random = function(svg_canvas, options){
      // First, select which wheels you're going to use on this run.
      var i_wheelA = Math.ceil(3*Math.random());
      var i_wheelB = Math.ceil(3*Math.random());
      if (options.wheels_never_match){
        while (i_wheelA === i_wheelB){
          i_wheelA = Math.ceil(3*Math.random());
          i_wheelB = Math.ceil(3*Math.random());
        }
      }
 
      casino_run(svg_canvas, i_wheelA, i_wheelB, options);
    };

    ///////////////////////
    // HIDDEN VARIABLES! //
    ///////////////////////

    // First, we need to actually write all the hidden variables down.
    // Binary ho!
    var all_hvs = {
      0:{1:0, 2:0, 3:0},
      1:{1:0, 2:0, 3:1},
      2:{1:0, 2:1, 3:0},
      3:{1:0, 2:1, 3:1},
      4:{1:1, 2:1, 3:1},
      5:{1:1, 2:1, 3:0},
      6:{1:1, 2:0, 3:1},
      7:{1:1, 2:0, 3:0}
    };

    // And apparently we need a global bool to tell the system whether or not the casino is paused and displaying hidden variables.
    // var hv_pause = false;

    // First, a simple convenience function for creating an SVG group that will contain everything related to the hidden variables --
    // the button that restarts the animation after they're displayed, the display of the HVs themselves, and the HV controls.
    var draw_hidden_vars_container = function(svg_canvas){
      svg_canvas.group().addClass('hv_group');
    }

    // And another convenience function, for randomly generating hidden variables.
    var generate_random_hidden_variable = function(){
      var hv = {};
      hv[1] = Math.round(Math.random());
      hv[2] = Math.round(Math.random());
      hv[3] = Math.round(Math.random());
      return hv;
    };

    // This is a function that will pause the casino animation and show the hidden variables, 
    // It will also draw a button that, when clicked, will continue the casino animation from where it paused.
    // This function is *never* called directly -- it's just called by the main casino animation function (casino_run_raw).
    // There's an option (display_hidden_variables) in the casino animation options that are passed to casino_run_raw that tells it to call this function.
    var pause_and_show_hidden_variables = function(svg_canvas, hidden_variables){
      // Tell the canvas that we've paused for HVs.
      svg_canvas.data('hv_pause', true);
      // First, we need to pause *all* animations.
      // SVG.get('dummyrect').pause();
      // Pause the balls in their tracks.
      svg_canvas.parent().select('.dummyrect').pause();
      // Pause the pointers.
      if (svg_canvas.data('spinnerA_rotating')){
        // cpointerA.pause();
        svg_canvas.select('.c3wheelA > .pointer').pause();
      }
      if (svg_canvas.data('spinnerB_rotating')){
        // cpointerB.pause();
        svg_canvas.select('.c3wheelB > .pointer').pause();
      }
      // Pause the balls in their wheels, and the wheels.
      svg_canvas.select('.prime-ball').pause();
      svg_canvas.select('.groupA').pause();
      svg_canvas.select('.groupB').pause();
      // Aball_prime.pause();
      // Bball_prime.pause();
      // SVG.get('groupA').pause();
      // SVG.get('groupB').pause();

      // We need a drop shadow (which must be defined here and not up top, otherwise the system freaks out when we scroll away and back)
      var dropshadow = new SVG.Filter();
      dropshadow.offset(2, 2).result('offsetFilter').in(dropshadow.sourceAlpha);
      dropshadow.gaussianBlur(1).in("offsetFilter").result('blurryoffsetFilter');
      dropshadow.blend(dropshadow.source, 'blurryoffsetFilter');
      dropshadow.attr({height:'150%', width:'150%'});

      //Next, we need to actually display our hidden variables.
      // Find the group where we'll put all of this stuff.
      // var hv_group = SVG.get('hv_group')
      var hv_group = svg_canvas.select('.hv_group').first();
      // Create a group for the left display.
      var hv_left_display_group = hv_group.group().addClass('hv-display-group');
      // Set some display variables.
      var hv_display_x = -triple_wheel_x_offset/2.5;
      var hv_display_y = machine_y_offset;
      // Put a rectangle in that group.
      var hv_left_rect = hv_left_display_group.rect(35, 15).radius(4).fill("gray").center(hv_display_x, hv_display_y);
      // Give that rectangle a dropshadow.
      hv_left_rect.filter(dropshadow);
      // Put circles with text in that rectangle.
      for (var i_wheel in hidden_variables){
        var x_loc = hv_display_x+(i_wheel-2)*3*hub_radius/2;
        hv_left_display_group.circle().radius(hub_radius/2)
          .center(x_loc, hv_display_y)
          // Hidden variables are of the form {1:0, 2:1, 3:0}.
          // This means you can't address those properties with dots.
          // In other words, hv.3 won't work, you have to do hv[3].
          // Suits me just fine, of course -- I come from the land of array arithmetic.
          .addClass(hidden_variables[i_wheel]?'result-red':'result-black');
        hv_left_display_group.text(''+i_wheel).addClass('hidden-vars').x(x_loc).cy(hv_display_y);
      }

      // Clone the whole damn thing for the right hand side.
      var hv_right_display_group = hv_left_display_group.clone().translate(-2*hv_display_x, 0);

      // Animate these HVs so they pop out of the roulette balls!
      // First, animate the scaling of the HV groups.
      var hv_displays = svg_canvas.select('.hv-display-group');
      hv_displays.scale(0.1);
      hv_displays.animate(500, '>').scale(1);
      // Then move the individual components of the groups.
      // Unfortunately, this can't be done by group, since groups don't really have positions.
      var dx_hv_final = -triple_wheel_x_offset/2 - hv_display_x;
      var dy_hv_final = 1.3*machine_y_offset - hv_display_y;
      hv_left_display_group.select('rect, circle').animate(500, '>').dmove(dx_hv_final, dy_hv_final);
      hv_right_display_group.select('rect, circle').animate(500, '>').dmove(-dx_hv_final, dy_hv_final);
      hv_left_display_group.select('text').animate(500, '>').dx(dx_hv_final).cy(hv_display_y + dy_hv_final);
      hv_right_display_group.select('text').animate(500, '>').dx(-dx_hv_final).cy(hv_display_y + dy_hv_final);

      // Finally, let's draw a button over the central box and attach a new click function to it.
      // When this button is pressed, the hidden variables will disappear and the animation will restart.
      var play_button_group = hv_group.group().addClass('button');
      play_button_group.rect(machine_box_width, machine_box_height).center(0, machine_y_offset);
      play_button_group.text('Continue...').x(0).cy(machine_y_offset);
      play_button_group.on('click', function(){
        svg_canvas.parent().select('.dummyrect').play();
        if (svg_canvas.data('spinnerA_rotating')){
          svg_canvas.select('.c3wheelA > .pointer').play();
        }
        if (svg_canvas.data('spinnerB_rotating')){
          svg_canvas.select('.c3wheelB > .pointer').play();
        }
        svg_canvas.select('.prime-ball').play();
        svg_canvas.select('.groupA').play();
        svg_canvas.select('.groupB').play();
        svg_canvas.data('hv_pause', false);
        hv_group.clear();       
      });
    }

    // And this is a function that will call casino_run_raw with the right stats for HVs (i.e. without violating the Bell inequality).
    // The wheels cannot be controlled by the reader with this run (i.e. this is an Aspect-style run.)
    // hidden_variables is a set of hidden variables, an object of the form {1:0, 2:1, 3:0}. 
    // The keys (1, 2, 3) correspond to wheels; the values (0, 1) correspond to black and red outcomes, respectively.
    // Options are the usual animation options. 
    // You don't have to put the hidden variables into the appropriate place in the options; this function will do that for you.
    var casino_run_random_with_hidden_variables = function(svg_canvas, hidden_variables, options){
      // First, select which wheels you're going to use on this run.
      var i_wheelA = Math.ceil(3*Math.random());
      var i_wheelB = Math.ceil(3*Math.random());
      if (options.wheels_never_match){
        while (i_wheelA === i_wheelB){
          i_wheelA = Math.ceil(3*Math.random());
          i_wheelB = Math.ceil(3*Math.random());
        }
      }
      // Then, make sure the outcomes match the instructions in the hidden variables.
      var outcomeA = hidden_variables[i_wheelA];
      var outcomeB = hidden_variables[i_wheelB];
      // Then, make sure that the hidden_variables parameter in the casino options is assigned the right value.
      var hv_options = Object.assign({}, options);
      hv_options['hidden_variables'] = hidden_variables;
      // Finally, actually run the casino.
      casino_run_raw(svg_canvas, i_wheelA, i_wheelB, outcomeA, outcomeB, hv_options);
    };

    // Finally, a function that creates one of those nice hidden variable badges for any given set of HVs.
    // We should really be using in pause_and_show_hidden_variables, and maybe someday we will.
    // But for now, this is useful elsewhere.
    // This takes a set of hidden variables (hv) and an SVG container (g) as arguments.
    // It returns a group within g that contains the badge for hv, centered on 0,0. You can translate it wherever you like.
    var hidden_variable_constructor = function(hv, g){
      // Create a group in g that will contain our hidden variables.
      var hv_g = g.group().addClass('hidden-vars');
      // Have each set of HVs be a data attribute on its group, so you can just attach the same function for clicking on all of them.
      hv_g.data('hv', hv);
      // And now borrow heavily from pause_and_show_hidden_variables.
      // Here's a rectangle.
      hv_g.rect(35, 15).radius(4).fill("gray")
        // .center(hv_center_x, hv_center_y);
        .center(0, 0);
      // Put circles with text in that rectangle.
      for (var i_wheel in hv){
        // var x_loc = hv_center_x+(i_wheel-2)*3*hub_radius/2;
        var x_loc = (i_wheel-2)*3*hub_radius/2;
        hv_g.circle().radius(hub_radius/2)
          // .center(x_loc, hv_center_y)
          .center(x_loc, 0)
          .addClass(hv[i_wheel]?'result-red':'result-black');
        hv_g.text(''+i_wheel).addClass('hidden-vars')
          // .x(x_loc).cy(hv_center_y);
          .x(x_loc).cy(0);
          // .x(x_loc).cy(0).animate(0).cy(0);
      }
      return hv_g;
    };

    ///////////////////////////////////
    //   DISPLAYING CASINO RESULTS   //
    ///////////////////////////////////

    // This function will draw the container that will hold the results of the most recent runs.
    // It takes one required argument, svg_canvas, which is just the canvas (or canvas-like element, like a group) that these results will be placed in.
    // It also takes an optional argument, v_offset, that will shift this container downward by the given amount.
    var draw_results_container = function(svg_canvas, v_offset){
      // Create a container to hold the results.
      var results_container = svg_canvas.group().addClass('results-container');
      // Put a dummy "zeroth" row of results in the new-results container to help with initializing the results updating process.
      results_container.group().addClass('results-row').addClass('new-results').data('i_row', 0, true);
      // Shift the container downward if needed.
      results_container.translate(0, v_offset);
      // Add in a label.
      results_container.text('RESULTS').addClass('svg-label').x(0).cy(-18);//.attr('text-decoration', 'underline')
      // Underline it.
      results_container.rect(50, 0.5).center(0, -13);
    }

    // This function will update the results display with the most recent results when called.
    // i_wheelA and i_wheelB: the wheels used on the most recent run.
    // outcomeA and outcomeB: the outcomes of the most recent run (0 = black, 1 = red).
    // duration is the duration of the animations associated with populating the new result in the results table. Set to 1.5 seconds by default.
    var update_results = function(svg_canvas, i_wheelA, i_wheelB, outcomeA, outcomeB, duration){
      // First, we need the previous new row.
      var prev_new_row = svg_canvas.select('.new-results').first();
      // Now, figure out the row number. It's one greater than the old new row number.
      var i_row = prev_new_row.data('i_row') + 1;
      // Then, remove the id 'new-results' from the row currently holding that id.
      prev_new_row.removeClass('new-results');
      // Make a set with all currently-existing rows, so we can move them all down.
      var rows = svg_canvas.select('.results-row');
      // Create a new container for the old results.
      var results_container = svg_canvas.select('.results-container').first();
      var old_results = results_container.group();//.addClass('old-results');
      // Add all the old rows to it.
      // old_results.add(rows);
      rows.addTo(old_results);
      // Animate moving the old results container downward.
      // When that's done, move each row downward instantly and remove the old-results container.
      old_results.animate(duration).dy(3*hub_radius)
        .after(function(){
          rows.toParent(results_container);
          old_results.remove();
        })
      // rows.each(function(i){
      //   SVG.get('old-results').add(this);
      // })
      // // Create the new row while moving the old rows down.
      // // The overall strategy here will be to set up the animation for the old rows, 
      // // then create the new row inside of a function that is called as that animation runs.
      // // This might get tricky, as we're hoping to change the opacity of each row too, as a function of its row number.
      // // Let's focus on position first, then tackle opacity.
      // rows.animate({duration:duration})
      //     .dy(3*hub_radius); // we want them to move 1.5 diameters downward
      //     // .each(function(i){
      //     //   // Take each row's opacity and lower it, as a function of the difference between that row's number and the newest row number.
      //     //   // Putting an each call with a function like this in it may not play nicely with animate. We'll see.
      //     //   // If this doesn't work, just do rows.each(function(i){this.animate(duration).attr(etc etc)})
      //     //   this.attr('opacity', 1-0.15(i_row - this.data('i_row')));
      //     // })
      // SVG.get('old-results').translate(0, 3*hub_radius);
      rows.each(function(i){
        this.animate(duration).attr('opacity', 1-0.2*(i_row - this.data('i_row'))).after(function(){
          if (i_row-this.data('i_row') >= 5){
            this.remove();
          }
        });
      });
      // Create the new row of results.
      var new_row = results_container.group().addClass('results-row').addClass('new-results').data('i_row', i_row, true);
      // Put the circles indicating the results into that row, but make them tiny!
      // Place them in the correct spots, and give them the correct classes for their colors.
      new_row.circle().radius(0).center(-triple_wheel_x_offset/6, 0).addClass("result").addClass(outcomeA?'result-red':'result-black');
      new_row.circle().radius(0).center(triple_wheel_x_offset/6, 0).addClass("result").addClass(outcomeB?'result-red':'result-black');
      // Do the same with the number labels for the circles -- put them in the right spots but make them tiny.
      new_row.text(String(i_wheelA)).attr('font-size', 0).x(-triple_wheel_x_offset/6).cy(0).addClass('result');
      new_row.text(String(i_wheelB)).attr('font-size', 0).x(triple_wheel_x_offset/6).cy(0).addClass('result');
      // Now we animate!
      new_row.select('circle.result').animate({duration:3*duration/4, delay:duration/4}).radius(hub_radius);
      new_row.select('text.result').animate({duration:3*duration/4, delay:duration/4}).attr('font-size', '12px').cy(0)
        .after(function(){this.cy(0)});
    }

    // This function draws the container that will hold the Bell statistics (fraction of runs that have mismatched wheels and matching colors).
    // It takes one argument, svg_canvas, which is just the canvas (or canvas-like element) that these results will be placed in.
    var draw_bell_stats_container = function(svg_canvas){
      var bell_stats = svg_canvas.group().addClass('bell_stats_container');
      bell_stats.rect(machine_box_width, machine_box_height).radius(5).center(0, 2*machine_y_offset).addClass('stats-box');
      // if the class is added after position, the position will be wrong.
      // And if there's no text here at all, the position will be wrong when this field is eventually populated.
      bell_stats.text('No Results...').addClass('stats-text').x(0).cy(2*machine_y_offset).data({numerator:0, denominator:0});
    }

    // This function updates the fraction of runs that have mismatched wheels but matching colors. 
    // This is the relevant quantity for violating Bell's inequality in this setup.
    var update_bell_stats = function(svg_canvas, i_wheelA, i_wheelB, outcomeA, outcomeB){
      // If there are mismatched wheels...
      if (i_wheelA !== i_wheelB){
        // ...update the denominator (number of runs with mismatched wheels)...
        // var text = SVG.get('stats-text');
        var text = svg_canvas.select('.stats-text').first();
        var old_denom = text.data('denominator');
        text.data('denominator', old_denom + 1);
        // ...then, if necessary, update the numerator (number of such runs with mismatched wheels and matching colors)...
        if (outcomeA === outcomeB){
          var old_num = text.data('numerator');
          text.data('numerator', old_num + 1);
        }
        //  ...and finally, update the text in the stats box.
        text.text('P = ' + text.data('numerator') + '/' + text.data('denominator') + ' = ' + Math.round(100*text.data('numerator')/text.data('denominator')) + '%');
      }
    };

    ////////////////////////////////
    //   CONTROLLING THE CASINO   //
    ////////////////////////////////

    // We'll need a variable to keep track of what set of hidden variables has currently been chosen by the reader.
    // Rather than leave this empty at the start, which could cause errors, we'll just set this to a random set of HVs.
    // If the reader chooses to run an HV casino without selecting a set of HVs, then whatever, there will be a random HV in place. No big deal.
    // var reader_chosen_hidden_variables = generate_random_hidden_variable();

    // There are casino control variables that every casino group has to carry.
    // Here's a default set of them.
    var default_casino_control_variables = {
      CASINO_RUNNING: false,
      spinnerA_rotating: false,
      spinnerB_rotating: false,
      i_wheelA: 2,
      i_wheelB: 2,
      hv_pause: false,
      reader_chosen_hidden_variables: generate_random_hidden_variable()
    }

    // The first of two functions that will allow the wheel selection buttons to behave correctly.
    // This one is for the left-hand set of buttons.
    // casino is the casino that this button is connected to.
    var wheelA_func = function(){
      // we need the container for the casino that this function is attached to.
      var cgroup = this.parent('.casino-group');
      // first, make sure that the spinner isn't rotating already and that the casino isn't running!
      if (!cgroup.data('spinnerA_rotating') && !cgroup.data('CASINO_RUNNING')){
        // Each button carries data about which wheel it corresponds to.
        var i = this.data('wheelnumber');
        // Don't do anything if you don't need to rotate the spinner at all!
        if (i !== cgroup.data('i_wheelA')){
          // Let everyone know that the spinner is spinning.
          cgroup.data('spinnerA_rotating', true);
          // Update the global variable that keeps track of which wheel is selected.
          cgroup.data('i_wheelA', i);
          // Identify the left-hand triple-wheel construct for the local casino.
          var c3wheelA_loc = cgroup.select('.c3wheelA').first();
          // Make sure all the buttons are de-selected.
          // dwheelsA.each(function(i){
          c3wheelA_loc.select('.wheel').each(function(i){
            this.select('.selected').removeClass('selected').addClass('selectable');
            this.select('.wheel-label').addClass('selectable');
          });
          // Calculate the angle you need to spin the spinner.
          var spinner_angleA = 120*Math.sign(Math.round(2-i));
          // Spin the spinner!
          // And when it's done spinning, select the wheel it's arrived at.
          var duration = 500
          // cpointerA.animate({duration:duration, ease:'>'}).rotate(spinner_angleA, 0, 0).after(function(){
          c3wheelA_loc.select('.pointer').animate({duration:duration, ease:'>'}).rotate(spinner_angleA, pointer_x, pointer_y).after(function(){
            c3wheelA_loc.select('.wheel' + i + ' > .center-circle').addClass('selected').removeClass('selectable');
            c3wheelA_loc.select('.wheel' + i + ' > .wheel-label').removeClass('selectable');
            cgroup.data('spinnerA_rotating', false);
          });
        }
      }
    };

    // And this one is for the right-hand set of buttons.
    var wheelB_func = function(){
      // we need the container for the casino that this function is attached to.
      var cgroup = this.parent('.casino-group');
      // first, make sure that the spinner isn't rotating already and that the casino isn't running!
      if (!cgroup.data('spinnerB_rotating') && !cgroup.data('CASINO_RUNNING')){
        // Each button carries data about which wheel it corresponds to.
        var i = this.data('wheelnumber');
        // Don't do anything if you don't need to rotate the spinner at all!
        if (i !== cgroup.data('i_wheelB')){
          // Let everyone know that the spinner is spinning.
          cgroup.data('spinnerB_rotating', true);
          // Update the global variable that keeps track of which wheel is selected.
          cgroup.data('i_wheelB', i);
          // Identify the left-hand triple-wheel construct for the local casino.
          var c3wheelB_loc = cgroup.select('.c3wheelB').first();
          // Make sure all the buttons are de-selected.
          // dwheelsA.each(function(i){
          c3wheelB_loc.select('.wheel').each(function(i){
            this.select('.selected').removeClass('selected').addClass('selectable');
            this.select('.wheel-label').addClass('selectable');
          });
          // Calculate the angle you need to spin the spinner.
          var spinner_angleB = 120*Math.sign(Math.round(2-i));
          // Spin the spinner!
          // And when it's done spinning, select the wheel it's arrived at.
          var duration = 500
          // cpointerA.animate({duration:duration, ease:'>'}).rotate(spinner_angleA, 0, 0).after(function(){
          c3wheelB_loc.select('.pointer').animate({duration:duration, ease:'>'}).rotate(spinner_angleB, pointer_x, pointer_y).after(function(){
            c3wheelB_loc.select('.wheel' + i + ' > .center-circle').addClass('selected').removeClass('selectable');
            c3wheelB_loc.select('.wheel' + i + ' > .wheel-label').removeClass('selectable');
            cgroup.data('spinnerB_rotating', false);
          });
        }
      }
    };

    // Actually drawing the wheel selection buttons.
    // These are transparent circles that sit on top of the central area (hub + whitespace) of each wheel.
    var draw_wheel_selection_buttons = function(svg_canvas){
      // Radius of the central white circle, pulled from the SVG.
      var button_radius = "24.5"

      // First, make a group to hold the left-hand set of buttons.
      var wheelbuttons_A = svg_canvas.group();
      // Draw the buttons, centered on the locations of the three wheels (see the section on building the casino).
      // Also add the class "wheelbutton" and a data attribute "wheelnumber" that keeps track of which wheel each button is assigned to.
      wheelbuttons_A.circle().radius(button_radius).center(0, -hyp).addClass('wheelbutton').data("wheelnumber", 1, true);
      wheelbuttons_A.circle().radius(button_radius).center(-xleg, yleg).addClass('wheelbutton').data("wheelnumber", 2, true);
      wheelbuttons_A.circle().radius(button_radius).center(xleg, yleg).addClass('wheelbutton').data("wheelnumber", 3, true);

      // Clone the left-hand buttons to create the right-hand buttons.
      var wheelbuttons_B = wheelbuttons_A.clone();

      // Move each set off to the side so they sit on top of their respective triple-wheel constructs. 
      // (Again, see the section on building the casino.)
      wheelbuttons_A.translate(-triple_wheel_x_offset, 0);
      wheelbuttons_B.translate(triple_wheel_x_offset, 0);

      // And finally, add the event listeners to the buttons that will fire off the appropriate functions when they're clicked.
      wheelbuttons_A.select('circle').on('click', wheelA_func)
      wheelbuttons_B.select('circle').on('click', wheelB_func)
    };

    // A function that draws a button that runs a totally controllable Bell casino -- one with radio buttons to allow manual wheel selection.
    // In other words, this is a "Clauser-style" run button.
    // This function takes one argument, svg_canvas, which is the SVG canvas to draw these buttons on.
    var draw_controlled_run_button = function(svg_canvas, options){
      // Draw the button.
      // We'll be placing it over the box in the middle of Ronnie's casino.
      var button = svg_canvas.group();
      button.addClass('button').addClass('run-button');
      button.rect(machine_box_width, machine_box_height).center(0, machine_y_offset);
      // Because we're loading an external font, and we don't have any idea of when it'll load,
      // the length of the text can change, and we can't just use center().
      // Instead, we make the horizontal anchor of the text in the middle (this is in CSS),
      // then place the horizontal anchor in the place where we want the text centered using the x() function.
      // We still need to center it vertically, but that's what cy() is for.
      button.text('Run Casino').cy(machine_y_offset).x(0);

      // Tell the button what to do when clicked.
      button.on('click', function(){
        if (!svg_canvas.data('CASINO_RUNNING')){
          svg_canvas.data('CASINO_RUNNING', true);
          button.addClass('button-on');
          casino_run(svg_canvas, svg_canvas.data('i_wheelA'), svg_canvas.data('i_wheelB'), options);
        }
      });
    };

    // We'd never want the wheel selection buttons without the controlled-run button, or vice-versa.
    // So here's a function that draws all of them together -- all the Clauser-style controls in one place.
    // This function takes one argument, svg_canvas, which is the SVG canvas to draw these buttons on.
    // This function also ensures that all the hubs have the class "selectable" applied, to differentiate them from cases where they're not selectable
    // (i.e. Aspect runs).
    var draw_all_controlled_run_buttons = function(svg_canvas, options){
      draw_wheel_selection_buttons(svg_canvas);
      draw_controlled_run_button(svg_canvas, options);
      svg_canvas.select('.wheel1 > .center-circle, .wheel1 > .wheel-label').addClass('selectable');
      svg_canvas.select('.wheel3 > .center-circle, .wheel3 > .wheel-label').addClass('selectable');
      // dwheelB1.select('.center-circle, .wheel-label').addClass('selectable');
      // dwheelB3.select('.center-circle, .wheel-label').addClass('selectable');
    };

    // A function that draws a button that runs a random Bell casino -- one where the wheels are selected while the roulette balls are en route.
    // In other words, this is an "Aspect-style" run button.
    // This function takes one argument, svg_canvas, which is the SVG canvas to draw these buttons on.
    // This function also ensures that none of the hubs have the class 'selectable' applied, to visually differentiate them from Clauser runs.
    var draw_random_run_button = function(svg_canvas, options){
      // Make sure none of the wheels appear selectable.
      // svg_canvas.select('.selectable').removeClass('selectable');
      // Draw the button.
      // We'll be placing it over the box in the middle of Ronnie's casino.
      var button = svg_canvas.group();
      button.addClass('button').addClass('run-button');
      button.rect(machine_box_width, machine_box_height).center(0, machine_y_offset);
      // Because we're loading an external font, and we don't have any idea of when it'll load,
      // the length of the text can change, and we can't just use center().
      // Instead, we make the horizontal anchor of the text in the middle (this is in CSS),
      // then place the horizontal anchor in the place where we want the text centered using the x() function.
      // We still need to center it vertically, but that's what cy() is for.
      button.text('Run Casino').cy(machine_y_offset).x(0);

      // Tell the button what to do when clicked.
      button.on('click', function(){
        if (!svg_canvas.data('CASINO_RUNNING')){
          svg_canvas.data('CASINO_RUNNING', true);
          button.addClass('button-on');
          casino_run_random(svg_canvas, options);
        }
      });
    };

    // A function that will draw a button for selecting hidden variables.
    // This button will be a rect like rect(35, 15).radius(4)
    // It will sit just below the machine box, just above the logged results.
    // When you click on it, it will bring up a new box that contains all eight possible HVs;
    // clicking one of those HVs in turn will cause the box to quickly vanish and the selected HV will be displayed in the box.
    // That HV will also be set to the value of reader_chosen_hidden_variables, 
    // which will ensure the casino runs with that HV (given the right casino run button, of course).
    var draw_HV_selection_button = function(svg_canvas){
      // We need a drop shadow (which must be defined here and not up top, otherwise the system freaks out when we scroll away and back)
      var dropshadow = new SVG.Filter();
      dropshadow.offset(2, 2).result('offsetFilter').in(dropshadow.sourceAlpha);
      dropshadow.gaussianBlur(1).in("offsetFilter").result('blurryoffsetFilter');
      dropshadow.blend(dropshadow.source, 'blurryoffsetFilter');
      dropshadow.attr({height:'150%', width:'150%'});
      // And of course we need a button.
      var button = svg_canvas.group();
      button.rect(55, 18).radius(4).center(0, machine_y_offset + machine_box_height).addClass('hv-button');
      // Because we're loading an external font, and we don't have any idea of when it'll load,
      // the length of the text can change, and we can't just use center().
      // Instead, we make the horizontal anchor of the text in the middle (this is in CSS),
      // then place the horizontal anchor in the place where we want the text centered using the x() function.
      // We still need to center it vertically, but that's what cy() is for.
      button.text('Pick Instructions').addClass('hidden-vars').addClass('hv-selection-button-contents').cy(machine_y_offset + machine_box_height).x(0);
      // Now add a little black rectangle to connect this button to the main button.
      svg_canvas.rect(2, machine_box_height/2-9).fill('black').center(0, machine_y_offset + 3*machine_box_height/4 - 4.5);
      // Tell the button what to do when clicked.
      // This is gonna get a little gnarly -- clicking this button brings up other objects that do things when clicked,
      // so we're gonna have a click function definition inside a click function definition.
      // Clickception!
      button.on('click', function(){
        if (!svg_canvas.data('CASINO_RUNNING')){
          button.addClass('button-on');
          // First, create a container for the nonsense you're about to inflict upon the world.
          var hv_selection_group = svg_canvas.group();
          // Draw a big ol' rect in there, center it on screen, and put a dropshadow on it.
          var selection_rect_width = 160;
          var selection_rect_height = 100;
          hv_selection_group.rect(selection_rect_width, selection_rect_height).radius(4)
            .center(0, 0)
            .addClass('hidden-vars-selector').filter(dropshadow);
          // Now loop over all the hidden variables.
          // Once again, Javascript does a halfway-decent Python impersonation.
          // A freelance astrophysicist could get used to this.
          for (var i_hv in all_hvs){
            // i_hv is the index, we want the hvs themselves too.
            var hv = all_hvs[i_hv];
            var hv_g = hidden_variable_constructor(hv, hv_selection_group);
            // Create a group to contain the displayed HVs.
            // var hv_g = hv_selection_group.group().addClass('hidden-vars');
            // Have each set of HVs be a data attribute on its group, so you can just attach the same function for clicking on all of them.
            // hv_g.data('hv', hv);
            // We need some variables defining the center of the display of the hvs as a function of i_hv.
            var hv_center_x = -selection_rect_width/4 + Math.floor(i_hv/4)*selection_rect_width/2;
            var hv_center_y = -3*selection_rect_height/10 + (i_hv%4)*selection_rect_height/5;
            // And now borrow heavily from pause_and_show_hidden_variables.
            // Here's a rectangle.
            // hv_g.rect(35, 15).radius(4).fill("gray")
            //   // .center(hv_center_x, hv_center_y);
            //   .center(0, 0);
            // // Put circles with text in that rectangle.
            // for (var i_wheel in hv){
            //   // var x_loc = hv_center_x+(i_wheel-2)*3*hub_radius/2;
            //   var x_loc = (i_wheel-2)*3*hub_radius/2;
            //   hv_g.circle().radius(hub_radius/2)
            //     // .center(x_loc, hv_center_y)
            //     .center(x_loc, 0)
            //     .addClass(hv[i_wheel]?'result-red':'result-black');
            //   hv_g.text(''+i_wheel).addClass('hidden-vars')
            //     // .x(x_loc).cy(hv_center_y);
            //     .x(x_loc).cy(0);
            // }
            // Move the whole thing where it belongs.
            hv_g.translate(hv_center_x, hv_center_y);
          }
          // Now center everything on the HV selection button, and animate this thing!
          hv_selection_group.translate(0, machine_y_offset + machine_box_height);
          hv_selection_group.scale(0.1);
          hv_selection_group.animate(500, '>').scale(1);
          // Now tell it what to do on click -- the aforementioned clickception.
          hv_selection_group.select('.hidden-vars').on('click', function(){
            // First, set the reader-chosen HVs to be the set of HVs that was clicked.
            svg_canvas.data('reader_chosen_hidden_variables', this.data('hv'));
            // Next, get rid of the contents of the HV selection button. (Remember the HV selection button?)
            // $('.hv-selection-button-contents').remove();
            svg_canvas.select('.hv-selection-button-contents').first().remove();
            // Now, stick the clicked HV into the HV selection button.
            var hv_display_copy = this.clone(button).addClass('hv-selection-button-contents');
            hv_display_copy.translate(0, machine_y_offset + machine_box_height);
            // Make sure the HV selection button is now off.
            button.removeClass('button-on');
            // Finally, animate this whole hv display group out of existence.
            hv_selection_group.animate(500, '<').scale(0.1).after(function(){
              this.remove();
            });
          });
        }
      });
    };

    // A function that will draw a run button for an "Aspect-style" casino with a pre-chosen set of hidden variables.
    var draw_selected_HV_run_button = function(svg_canvas, options){
      // Draw the button.
      // We'll be placing it over the box in the middle of Ronnie's casino.
      var button = svg_canvas.group();
      button.addClass('button').addClass('run-button');
      button.rect(machine_box_width, machine_box_height).center(0, machine_y_offset);
      // Because we're loading an external font, and we don't have any idea of when it'll load,
      // the length of the text can change, and we can't just use center().
      // Instead, we make the horizontal anchor of the text in the middle (this is in CSS),
      // then place the horizontal anchor in the place where we want the text centered using the x() function.
      // We still need to center it vertically, but that's what cy() is for.
      button.text('Run Casino').cy(machine_y_offset).x(0);

      // Tell the button what to do when clicked.
      button.on('click', function(){
        if (!svg_canvas.data('CASINO_RUNNING')){
          svg_canvas.data('CASINO_RUNNING', true);
          button.addClass('button-on');
          casino_run_random_with_hidden_variables(svg_canvas, svg_canvas.data('reader_chosen_hidden_variables'), options);
        }
      });
    };

    // A function that draws everything you need to let the reader select their own hidden variables.
    var draw_all_selected_HV_run_buttons = function(svg_canvas, options){
      draw_selected_HV_run_button(svg_canvas, options);
      draw_HV_selection_button(svg_canvas);
      // also need to make sure none of the wheels appear selectable.
      // SVG.select('.selectable').removeClass('selectable');
    };

    // This function draws a run button for an "Aspect-style" casino with randomly-chosen hidden variables, not violating the Bell inequality.
    // It also draws a little indicator below that button showing what the hidden variable is for the run.
    var draw_random_HV_run_button = function(svg_canvas, options){
      // Need to make sure none of the wheels appear selectable.
      // SVG.select('.selectable').removeClass('selectable');
      // Draw the button.
      // We'll be placing it over the box in the middle of Ronnie's casino.
      var button = svg_canvas.group();
      button.addClass('button').addClass('run-button');
      button.rect(machine_box_width, machine_box_height).center(0, machine_y_offset);
      // Because we're loading an external font, and we don't have any idea of when it'll load,
      // the length of the text can change, and we can't just use center().
      // Instead, we make the horizontal anchor of the text in the middle (this is in CSS),
      // then place the horizontal anchor in the place where we want the text centered using the x() function.
      // We still need to center it vertically, but that's what cy() is for.
      button.text('Run Casino').cy(machine_y_offset).x(0);

      // Add in the HV indicator (which is basically just the same as the HV selection button, except that you can't click it)
      var hv_indicator = svg_canvas.group();
      hv_indicator.rect(55, 18).radius(4).center(0, machine_y_offset + machine_box_height).addClass('hv-indicator');
      // Because we're loading an external font, and we don't have any idea of when it'll load,
      // the length of the text can change, and we can't just use center().
      // Instead, we make the horizontal anchor of the text in the middle (this is in CSS),
      // then place the horizontal anchor in the place where we want the text centered using the x() function.
      // We still need to center it vertically, but that's what cy() is for.
      // button.text('Pick Instructions').addClass('hidden-vars').addClass('hv-selection-button-contents').cy(machine_y_offset + machine_box_height).x(0);
      // Now add a little black rectangle to connect this button to the main button.
      svg_canvas.rect(2, machine_box_height/2-9).fill('black').center(0, machine_y_offset + 3*machine_box_height/4 - 4.5);

      // Take the current system HV and add it to the HV indicator.
      var hv_g = hidden_variable_constructor(svg_canvas.data('reader_chosen_hidden_variables'), hv_indicator);
      hv_g.translate(0, machine_y_offset + machine_box_height);

      // Tell the button what to do when clicked.
      button.on('click', function(){
        if (!svg_canvas.data('CASINO_RUNNING')){
          svg_canvas.data('CASINO_RUNNING', true);
          button.addClass('button-on');
          hv_g.remove();
          hv_g = hidden_variable_constructor(svg_canvas.data('reader_chosen_hidden_variables'), hv_indicator);
          hv_g.translate(0, machine_y_offset + machine_box_height);
          casino_run_random_with_hidden_variables(svg_canvas, svg_canvas.data('reader_chosen_hidden_variables'), options);
          svg_canvas.data('reader_chosen_hidden_variables', generate_random_hidden_variable());
        }
      });
    };

    // A function that will draw a button that does an Aspect-style quantum run n times in a row.
    var draw_random_run_n_times_button = function(svg_canvas, n_times, options){
      // Need to make sure none of the wheels appear selectable.
      // SVG.select('.selectable').removeClass('selectable');
      // Draw the button.
      // We'll be placing it over the box in the middle of Ronnie's casino.
      var button = svg_canvas.group();
      button.addClass('button').addClass('run-button');
      button.rect(machine_box_width, machine_box_height).center(0, machine_y_offset);
      // Because we're loading an external font, and we don't have any idea of when it'll load,
      // the length of the text can change, and we can't just use center().
      // Instead, we make the horizontal anchor of the text in the middle (this is in CSS),
      // then place the horizontal anchor in the place where we want the text centered using the x() function.
      // We still need to center it vertically, but that's what cy() is for.
      button.text('Run ' + n_times + 'x').cy(machine_y_offset).x(0);
      // Make sure the repetition option gets the right value.
      var rep_options = Object.assign({}, options);
      rep_options['n_repetitions'] = n_times - 1;
      // Tell the button what to do when clicked.
      button.on('click', function(){
        if (!svg_canvas.data('CASINO_RUNNING')){
          svg_canvas.data('CASINO_RUNNING', true);
          button.addClass('button-on');
          casino_run_random(svg_canvas, rep_options);
        }
      });
    };

    // A function that will draw a run button for an "Aspect-style" casino with a pre-chosen set of hidden variables, and will repeat n times.
    var draw_selected_HV_run_n_times_button = function(svg_canvas, n_times, options){
      // Draw the button.
      // We'll be placing it over the box in the middle of Ronnie's casino.
      var button = svg_canvas.group();
      button.addClass('button').addClass('run-button');
      button.rect(machine_box_width, machine_box_height).center(0, machine_y_offset);
      // Because we're loading an external font, and we don't have any idea of when it'll load,
      // the length of the text can change, and we can't just use center().
      // Instead, we make the horizontal anchor of the text in the middle (this is in CSS),
      // then place the horizontal anchor in the place where we want the text centered using the x() function.
      // We still need to center it vertically, but that's what cy() is for.
      button.text('Run ' + n_times + 'x').cy(machine_y_offset).x(0);
      // Make sure the repetition option gets the right value.
      var rep_options = Object.assign({}, options);
      rep_options['n_repetitions'] = n_times - 1;
      // Tell the button what to do when clicked.
      button.on('click', function(){
        if (!svg_canvas.data('CASINO_RUNNING')){
          svg_canvas.data('CASINO_RUNNING', true);
          button.addClass('button-on');
          casino_run_random_with_hidden_variables(svg_canvas, svg_canvas.data('reader_chosen_hidden_variables'), rep_options);
        }
      });
    };

    // A function that draws everything you need to let the reader select their own hidden variables for an n-run HV casino.
    var draw_all_selected_HV_run_n_times_buttons = function(svg_canvas, n_times, options){
      draw_selected_HV_run_n_times_button(svg_canvas, n_times, options);
      draw_HV_selection_button(svg_canvas);
      // Also need to make sure none of the wheels appear selectable.
      // SVG.select('.selectable').removeClass('selectable');
    };

    ////////////////////////////////////////////////////
    //   FUNCTIONS THAT WILL INSTANTIATE THE CASINO   //
    ////////////////////////////////////////////////////

    // Actually create the canvases. Make them resizable, but make sure they maintain their aspect ratios as they're resized.
    var canvas1 = SVG("canvas-1-div").attr({viewBox: '0 0 ' + String(xbox) + ' ' + String(ybox), preserveAspectRatio: 'xMinYMin meet'})
      .addClass('casino-canvas');
    var canvas2 = SVG("canvas-2-div").attr({viewBox: '0 0 ' + String(xbox) + ' ' + String(ybox), preserveAspectRatio: 'xMinYMin meet'})
      .addClass('casino-canvas');
    var canvas3 = SVG("canvas-3-div").attr({viewBox: '0 0 ' + String(xbox) + ' ' + String(ybox), preserveAspectRatio: 'xMinYMin meet'})
      .addClass('casino-canvas');
    var canvas4 = SVG("canvas-4-div").attr({viewBox: '0 0 ' + String(xbox) + ' ' + String(ybox), preserveAspectRatio: 'xMinYMin meet'})
      .addClass('casino-canvas');
    var canvas5 = SVG("canvas-5-div").attr({viewBox: '0 0 ' + String(xbox) + ' ' + String(ybox), preserveAspectRatio: 'xMinYMin meet'})
      .addClass('casino-canvas');
    var canvas6 = SVG("canvas-6-div").attr({viewBox: '0 0 ' + String(xbox) + ' ' + String(ybox), preserveAspectRatio: 'xMinYMin meet'})
      .addClass('casino-canvas');
    var canvas7 = SVG("canvas-7-div").attr({viewBox: '0 0 ' + String(xbox) + ' ' + String(ybox), preserveAspectRatio: 'xMinYMin meet'})
      .addClass('casino-canvas');

    // When the casinos are full-size, they're just a bit too wide for the screen.
    // So we need to scale them down to no larger than about 97% of their original size.
    var casino_scale = 0.95;

    // Remember, the casino lives in the definitions.
    // We still need to actually put one (or several) on the screen!
    // But this is the easy part, because we've already done all the hard work.  

    var draw_casino1 = function(){
      // First, make sure this casino doesn't already exist!
      // if (!(canvas1.select('.casino-group').first() || isScrolling)){
      // if (!canvas1.select('.casino-group').first()){
        // Erase all the other casino canvases.
        // SVG.select('.casino-canvas').each(function(){this.clear()});
        // Testing the origin of the FF OSX text-centering bug.
        // dwheelA3.select('text').cy(wheel_y);
        // Stop the casino if it's not already stopped.
        // casino_stop_and_reset();
        // Erase the most recently visited canvas.
        // canvas2.clear();
        // canvas2.animate(150).opacity(0).after(function(){canvas2.clear()});
        // Create a group to hold the casino and its controls.
        var casino1_group = canvas1.group().addClass('casino-group');
        // Give that casino group the data set it needs to be a casino group.
        // casino1_group.data('control_variables', Object.assign({}, default_casino_control_variables), true);
        casino1_group.data(default_casino_control_variables);
        // Put the casino on the screen!
        // casino1.use(dcasino);
        dcasino.clone(casino1_group);

        // draw_wheel_selection_buttons(casino1_group);

        // Put the controls on the screen.
        draw_all_controlled_run_buttons(casino1_group, animation_options({
          spinners_preset:true
        }));

        // And put a container for results on the screen.
        // draw_results_container(casino1);
        // And a container for Bell stats.
        // draw_bell_stats_container(casino1);
        // // And draw a container for the hidden variables stuff.
        // draw_hidden_vars_container(casino1);
        // We're still centered on the origin, which is the upper-left-hand corner of the screen. 
        // Let's move to the center of the screen.
        casino1_group.translate(center_x, center_y);
        casino1_group.scale(casino_scale);
        // Finally, let's animate this into visibility.
        // casino1.opacity(0);
        // casino1.animate(300).opacity(1);
        // canvas1.opacity(0);
        // canvas1.animate(300).opacity(1);
      // }
    };

    // var erase_casino1 = function(direction){
    //   // canvas1.animate(150).opacity(0).after(function(){canvas1.clear()});
    //   canvas1.clear();
    //   casino_stop_and_reset();
    //   if (direction === 'down'){
    //     draw_casino2();
    //   }
    // }

    var draw_casino2 = function(){
      // First, make sure this casino doesn't already exist!
      // if (!(canvas2.select('.casino-group').first() || isScrolling)){
      // if (!canvas2.select('.casino-group').first()){
        // Erase all the other casino canvases.
        // SVG.select('.casino-canvas').each(function(){this.clear()});
        // Stop the casino if it's not already stopped.
        // casino_stop_and_reset();
        // Erase the most recently visited canvas, depending on the direction of scroll.
        // if (scrollobj.lastTop < scrollobj.curTop) {
        // if (direction === 'down') {
        //   canvas1.clear();
        //   // canvas1.animate(150).opacity(0).after(function(){canvas1.clear()});
        // }
        // else {
        //   canvas3.clear();
        //   // canvas3.animate(150).opacity(0).after(function(){canvas3.clear()});
        // }
        // Create a group to hold the casino and its controls.
        var casino2_group = canvas2.group().addClass('casino-group');
        casino2_group.data(default_casino_control_variables);
        // Put the casino on the screen!
        // casino2.use(dcasino);
        dcasino.clone(casino2_group);
        // Put the controls on the screen.
        // draw_random_run_button(casino2, animation_options({display_bell_stats:true}));
        // draw_random_run_button(casino2, animation_options({
        //   display_results:true
        // }));
        draw_random_run_button(casino2_group, default_animation_options);
        // draw_random_run_n_times_button(casino2, 100, animation_options({
        // // draw_all_selected_HV_run_n_times_buttons(casino2, 20, animation_options({
        //   duration: 75,
        //   results_animation_duration:50,
        //   display_results:true,
        //   display_bell_stats: true,
        //   wheels_never_match: true
        // }));
        // Draw a container for the Bell stats.
        // draw_bell_stats_container(casino2);
        // And draw a container for the hidden variables stuff.
        // draw_hidden_vars_container(casino2);
        // And draw a container for the results.
        // draw_results_container(casino2);
        // We're still centered on the origin, which is the upper-left-hand corner of the screen. 
        // Let's move to the center of the screen.
        casino2_group.translate(center_x, center_y);
        casino2_group.scale(casino_scale);
        // Finally, let's animate this into visibility.
        // canvas2.opacity(0);
        // canvas2.animate(300).opacity(1);
      // }
    };

    // var erase_casino2 = function(direction){
    //   canvas2.clear();
    //   casino_stop_and_reset();
    //   // Check for scroll direction and draw the next casino as appropriate.
    //   // if (scrollobj.lastTop < scrollobj.curTop) {
    //   if (direction === 'down') {
    //     draw_casino3();
    //   }
    //   else {
    //     draw_casino1();
    //   }
    // };

    var draw_casino3 = function(){
      // First, make sure this casino doesn't already exist!
      // if (!(canvas3.select('.casino-group').first() || isScrolling)){
      // if (!canvas3.select('.casino-group').first()){
        // Erase all the other casino canvases.
        // SVG.select('.casino-canvas').each(function(){this.clear()});
        // Stop the casino if it's not already stopped.
        // casino_stop_and_reset();
        // Erase the most recently visited canvas, depending on the direction of scroll.
        // if (scrollobj.lastTop < scrollobj.curTop) {
        // if (direction === 'down') {
        //   canvas2.clear();
        //   // canvas2.animate(150).opacity(0).after(function(){canvas2.clear()});
        // }
        // else {
        //   canvas4.clear();
        //   // canvas4.animate(150).opacity(0).after(function(){canvas4.clear()});
        // }
        // Create a group to hold the casino and its controls.
        var casino3_group = canvas3.group().addClass('casino-group');
        // Put the casino on the screen!
        // casino3.use(dcasino);

        casino3_group.data(default_casino_control_variables);
        dcasino.clone(casino3_group);
        // Put the controls on the screen.
        draw_all_controlled_run_buttons(casino3_group, animation_options({
          spinners_preset:true, 
          display_results:true
        }));
        // And put a container for results on the screen.
        draw_results_container(casino3_group, 5);
        // And a container for Bell stats.
        // draw_bell_stats_container(casino3);
        // // And draw a container for the hidden variables stuff.
        // draw_hidden_vars_container(casino1);
        // We're still centered on the origin, which is the upper-left-hand corner of the screen. 
        // Let's move to the center of the screen.
        casino3_group.translate(center_x, center_y);
        casino3_group.scale(casino_scale);
        // Finally, let's animate this into visibility.
        // canvas3.opacity(0);
        // canvas3.animate(300).opacity(1);
      // }
    };

    // var erase_casino3 = function(direction){
    //   canvas3.clear();
    //   casino_stop_and_reset();
    //   // Check for scroll direction and draw the next casino as appropriate.
    //   // if (scrollobj.lastTop < scrollobj.curTop) {
    //   if (direction === 'down') {
    //     draw_casino4();
    //   }
    //   else {
    //     draw_casino2();
    //   }
    // }

    var draw_casino4 = function(){
      // First, make sure this casino doesn't already exist!
      // if (!(canvas4.select('.casino-group').first() || isScrolling)){
      // if (!canvas4.select('.casino-group').first()){
        // Erase all the other casino canvases.
        // SVG.select('.casino-canvas').each(function(){this.clear()});
        // Stop the casino if it's not already stopped.
        // casino_stop_and_reset();
        // Erase the most recently visited canvas, depending on the direction of scroll.
        // if (scrollobj.lastTop < scrollobj.curTop) {
        // if (direction === 'down') {
        //   canvas3.clear();
        //   // canvas3.animate(150).opacity(0).after(function(){canvas3.clear()});
        // }
        // else {
        //   canvas5.clear();
        //   // canvas5.animate(150).opacity(0).after(function(){canvas5.clear()});
        // }
        // Create a group to hold the casino and its controls.
        var casino4 = canvas4.group().addClass('casino-group');
        // Put the casino on the screen!
        // casino4.use(dcasino);

        casino4.data(default_casino_control_variables);
        dcasino.clone(casino4);
        // Put the controls on the screen.
        draw_random_run_button(casino4, animation_options({
          display_results:true
        }));
        // And put a container for results on the screen.
        draw_results_container(casino4, 5);
        // And a container for Bell stats.
        // draw_bell_stats_container(casino4);
        // // And draw a container for the hidden variables stuff.
        // draw_hidden_vars_container(casino1);
        // We're still centered on the origin, which is the upper-left-hand corner of the screen. 
        // Let's move to the center of the screen.
        casino4.translate(center_x, center_y);
        casino4.scale(casino_scale);
        // Finally, let's animate this into visibility.
        // canvas4.opacity(0);
        // canvas4.animate(300).opacity(1);
      // }
    };

    // var erase_casino4 = function(direction){
    //   canvas4.clear();
    //   casino_stop_and_reset();
    //   // Check for scroll direction and draw the next casino as appropriate.
    //   // if (scrollobj.lastTop < scrollobj.curTop) {
    //   if (direction === 'down') {
    //     draw_casino5();
    //   }
    //   else {
    //     draw_casino3();
    //   }
    // }

    var draw_casino5 = function(){
      // First, make sure this casino doesn't already exist!
      // if (!(canvas5.select('.casino-group').first() || isScrolling)){
      // if (!canvas5.select('.casino-group').first()){
        // Erase all the other casino canvases.
        // SVG.select('.casino-canvas').each(function(){this.clear()});
        // Stop the casino if it's not already stopped.
        // casino_stop_and_reset();
        // Erase the most recently visited canvas, depending on the direction of scroll.
        // if (scrollobj.lastTop < scrollobj.curTop) {
        // if (direction === 'down') {
        //   canvas4.clear();
        //   // canvas4.animate(150).opacity(0).after(function(){canvas4.clear()});
        // }
        // else {
        //   canvas6.clear();
        //   // canvas6.animate(150).opacity(0).after(function(){canvas6.clear()});
        // }
        // Create a group to hold the casino and its controls.
        var casino5 = canvas5.group().addClass('casino-group');
        // Put the casino on the screen!
        // casino5.use(dcasino);
        casino5.data(default_casino_control_variables);
        dcasino.clone(casino5);
        // Put the controls on the screen.
        draw_random_HV_run_button(casino5, animation_options({
          display_results:true, 
          display_hidden_variables: true
        }));
        // And put a container for results on the screen.
        draw_results_container(casino5, 24);
        // And a container for Bell stats.
        // draw_bell_stats_container(casino5);
        // And draw a container for the hidden variables stuff.
        draw_hidden_vars_container(casino5);
        // We're still centered on the origin, which is the upper-left-hand corner of the screen. 
        // Let's move to the center of the screen.
        casino5.translate(center_x, center_y);
        casino5.scale(casino_scale);
        // Finally, let's animate this into visibility.
        // canvas5.opacity(0);
        // canvas5.animate(300).opacity(1);
      // }
    };

    // var erase_casino5 = function(direction){
    //   canvas5.clear();
    //   casino_stop_and_reset();
    //   // Check for scroll direction and draw the next casino as appropriate.
    //   // if (scrollobj.lastTop < scrollobj.curTop) {
    //   if (direction === 'down') {
    //     draw_casino6();
    //   }
    //   else {
    //     draw_casino4();
    //   }
    // }

    var draw_casino6 = function(){
      // First, make sure this casino doesn't already exist!
      // if (!(canvas6.select('.casino-group').first() || isScrolling)){
      // if (!canvas6.select('.casino-group').first()){
        // Erase all the other casino canvases.
        // SVG.select('.casino-canvas').each(function(){this.clear()});
        // Stop the casino if it's not already stopped.
        // casino_stop_and_reset();
        // Erase the most recently visited canvas, depending on the direction of scroll.
        // if (scrollobj.lastTop < scrollobj.curTop) {
        // if (direction === 'down') {
        //   canvas5.clear();
        //   // canvas5.animate(150).opacity(0).after(function(){canvas5.clear()});
        // }
        // else {
        //   canvas7.clear();
        //   // canvas7.animate(150).opacity(0).after(function(){canvas7.clear()});
        // }
        // Create a group to hold the casino and its controls.
        var casino6 = canvas6.group().addClass('casino-group');
        // Put the casino on the screen!
        // casino6.use(dcasino);
        casino6.data(default_casino_control_variables);
        dcasino.clone(casino6);
        // Put the controls on the screen.
        draw_random_run_n_times_button(casino6, 60, animation_options({
          duration: 100,
          results_animation_duration: 75,
          display_results:true, 
          display_bell_stats: true,
          wheels_never_match: true
        }));
        // And put a container for results on the screen.
        draw_results_container(casino6, 5);
        // And a container for Bell stats.
        draw_bell_stats_container(casino6);
        // // And draw a container for the hidden variables stuff.
        // draw_hidden_vars_container(casino1);
        // We're still centered on the origin, which is the upper-left-hand corner of the screen. 
        // Let's move to the center of the screen.
        casino6.translate(center_x, center_y);
        casino6.scale(casino_scale);
        // Finally, let's animate this into visibility.
        // canvas6.opacity(0);
        // canvas6.animate(300).opacity(1);
      // }
    };

    // var erase_casino6 = function(direction){
    //   canvas6.clear();
    //   casino_stop_and_reset();
    //   // Check for scroll direction and draw the next casino as appropriate.
    //   // if (scrollobj.lastTop < scrollobj.curTop) {
    //   if (direction === 'down') {
    //     draw_casino7();
    //   }
    //   else {
    //     draw_casino5();
    //   }
    // }

    var draw_casino7 = function(){
      // First, make sure this casino doesn't already exist!
      // if (!(canvas7.select('.casino-group').first() || isScrolling)){
      // if (!canvas7.select('.casino-group').first()){
        // Erase all the other casino canvases.
        // SVG.select('.casino-canvas').each(function(){this.clear()});
        // Stop the casino if it's not already stopped.
        // casino_stop_and_reset();
        // Erase the most recently visited canvas.
        // canvas6.clear();
        // OK, apparently there's no good way to animate the clearing of earlier casinos without creating bugs,
        // short of clearing them, then immediately putting another dcasino in them, then animating that away, then clearing THAT.
        // Or we could put a class on all control groups and result groups, clear those instantly, then fade away the rest.
        // But frankly, this is such a damn edge case and it's taken so damn long to even get this minimally working that I don't care to throw in this
        // do all that work for this nigh-invisible piece of animation, at least not right now.
        // canvas6.animate(150).opacity(0).after(function(){canvas6.clear()});
        // Create a group to hold the casino and its controls.
        var casino7 = canvas7.group().addClass('casino-group');
        // Put the casino on the screen!
        // casino7.use(dcasino);
        casino7.data(default_casino_control_variables);
        dcasino.clone(casino7);
        // Put the controls on the screen.
        draw_all_selected_HV_run_n_times_buttons(casino7, 60, animation_options({
          duration: 100,
          results_animation_duration: 75,
          display_results:true, 
          display_bell_stats: true,
          // display_hidden_variables: true,
          wheels_never_match: true
        }));
        // And put a container for results on the screen.
        draw_results_container(casino7, 24);
        // And a container for Bell stats.
        draw_bell_stats_container(casino7);
        // And draw a container for the hidden variables stuff.
        draw_hidden_vars_container(casino7);
        // We're still centered on the origin, which is the upper-left-hand corner of the screen. 
        // Let's move to the center of the screen.
        casino7.translate(center_x, center_y);
        casino7.scale(casino_scale);
        // Finally, let's animate this into visibility.
        // canvas7.opacity(0);
        // canvas7.animate(300).opacity(1);
      // }
    };

    // var erase_casino7 = function(direction){
    //   canvas7.clear();
    //   casino_stop_and_reset();
    //   if (direction === 'up'){
    //     draw_casino6()
    //   }
    // }

    // Actually draw them!

    draw_casino1();
    draw_casino2();
    draw_casino3();
    draw_casino4();
    draw_casino5();
    draw_casino6();
    draw_casino7();

    ////////////////////////////
    // BUILDING STATIC IMAGES //
    ////////////////////////////

    // I tried to do this with loading external SVG files, but then we'd need to put the CSS rules in those files,
    // and that would mean duplicating the CSS and loading the external fonts twice.
    // Easier and faster to just put everything here.

    var fig1_canvas = SVG("figure-1-div").attr({viewBox: '0 0 ' + String(xbox) + ' ' + String(ybox), preserveAspectRatio: 'xMinYMin meet'});
    var fig2_canvas = SVG("figure-2-div").attr({viewBox: '0 0 ' + String(xbox) + ' ' + String(ybox), preserveAspectRatio: 'xMinYMin meet'});
    // var fig3_canvas = SVG("figure-3-div").attr({viewBox: '0 0 ' + String(xbox) + ' ' + String(ybox), preserveAspectRatio: 'xMinYMin meet'});
    var fig3_canvas = SVG("figure-3-div").attr({preserveAspectRatio: 'xMinYMin meet'});
    fig3_canvas.viewbox(0, ybox/6, xbox, 7*ybox/12);
    // var fig4_canvas = SVG("figure-4-div").attr({viewBox: '0 0 ' + String(xbox) + ' ' + String(ybox), preserveAspectRatio: 'xMinYMin meet'});
    // var fig5_canvas = SVG("figure-5-div").attr({viewBox: '0 0 ' + String(xbox) + ' ' + String(ybox), preserveAspectRatio: 'xMinYMin meet'});
    var fig4_canvas = SVG("figure-4-div").attr({preserveAspectRatio: 'xMinYMin meet'});
    fig4_canvas.viewbox(0, ybox/6, xbox, 2*ybox/3);
    var fig5_canvas = SVG("figure-5-div").attr({preserveAspectRatio: 'xMinYMin meet'});
    fig5_canvas.viewbox(0, ybox/6, xbox, 2*ybox/3);


    ///// FIGURE 1 ////////
    // Creating an image of some results.
    var fig1_container = fig1_canvas.group();
    // Add in a label. 
    fig1_container.text('RESULTS').addClass('svg-label').x(0).cy(-80);//.style('text-decoration', 'underline')
    // Underline it.
    fig1_container.rect(50, 0.5).center(0, -75);
    // OK, now we'll need some results.
    // Here's an object full of them.
    var fig1_results = {
      0:{wheelA:3, wheelB:1, outcomeA:1, outcomeB:0},
      1:{wheelA:1, wheelB:1, outcomeA:1, outcomeB:1},
      2:{wheelA:3, wheelB:2, outcomeA:0, outcomeB:1},
      3:{wheelA:1, wheelB:3, outcomeA:1, outcomeB:1},
      4:{wheelA:1, wheelB:2, outcomeA:0, outcomeB:1},
      5:{wheelA:2, wheelB:2, outcomeA:0, outcomeB:0},
    }
    // Display the results.
    for (var i_result_fig1 in fig1_results){
      // Create a row and put circles and text in it.
      var fig1_row = fig1_container.group();
      var fig1_res = fig1_results[i_result_fig1];
      fig1_row.circle().radius(hub_radius).center(-triple_wheel_x_offset/6, 0).addClass("result").addClass(fig1_res.outcomeA?'result-red':'result-black');
      fig1_row.circle().radius(hub_radius).center(triple_wheel_x_offset/6, 0).addClass("result").addClass(fig1_res.outcomeB?'result-red':'result-black');
      fig1_row.text(String(fig1_res.wheelA)).attr('font-size', '12px').x(-triple_wheel_x_offset/6).cy(0).addClass('result').animate(0).cy(0);
      fig1_row.text(String(fig1_res.wheelB)).attr('font-size', '12px').addClass('result').x(triple_wheel_x_offset/6).cy(0).animate(0).cy(0);
      // Position the row based on the index number.
      fig1_row.dy(-60+i_result_fig1*3*hub_radius);
    }
    // Move the whole thing to the center.
    fig1_container.translate(center_x, center_y);


    ///// FIGURE 2 ////////
    // Creating an image of the same results as Figure 1, but strike through the rows where the wheels are the same.
    var fig2_container = fig2_canvas.group();
    // Add in a label. 
    fig2_container.text('RESULTS').addClass('svg-label').x(0).cy(-80);//.style('text-decoration', 'underline')
    // Underline it.
    fig2_container.rect(50, 0.5).center(0, -75);
    // Display the results.
    // If the two wheels are the same, lower the opacity of the row and strike it through with a rect.
    for (var i_result_fig2 in fig1_results){
      // Create a row and put circles and text in it.     
      var fig2_row = fig2_container.group();
      var fig2_res = fig1_results[i_result_fig2];
      fig2_row.circle().radius(hub_radius).center(-triple_wheel_x_offset/6, 0).addClass("result").addClass(fig2_res.outcomeA?'result-red':'result-black');
      fig2_row.circle().radius(hub_radius).center(triple_wheel_x_offset/6, 0).addClass("result").addClass(fig2_res.outcomeB?'result-red':'result-black');
      fig2_row.text(String(fig2_res.wheelA)).attr('font-size', '12px').x(-triple_wheel_x_offset/6).cy(0).addClass('result').animate(0).cy(0);
      fig2_row.text(String(fig2_res.wheelB)).attr('font-size', '12px').x(triple_wheel_x_offset/6).cy(0).addClass('result').animate(0).cy(0);
      // Position the row based on the index number.
      fig2_row.dy(-60+i_result_fig2*3*hub_radius);
      if (fig2_res.wheelA === fig2_res.wheelB){
        fig2_row.opacity(0.3);
        fig2_container.rect(triple_wheel_x_offset/2, hub_radius/4).center(0, -60+i_result_fig2*3*hub_radius);
      }
    }
    // Move the whole thing to the center.
    fig2_container.translate(center_x, center_y);


    ///// FIGURE 3 ////////
    // Creating an image of the same results as Figure 1, but strike through the rows where the wheels are the same.
    var fig3_container = fig3_canvas.group();
    // Add in a label. 
    fig3_container.text('RESULTS').addClass('svg-label').x(0).cy(-60);//.style('text-decoration', 'underline')
    // Underline it.
    fig3_container.rect(50, 0.5).center(0, -55);
    // We'll need a variable to keep track of what row we're on, because we're getting rid of some of the rows in the results.
    var i_row_fig3 = 0
    // Display the results.
    // But if the two wheels are the same, don't display it.
    // And if the two wheels aren't the same but the colors are the same, draw a box around it.
    for (var i_result_fig3 in fig1_results){
      var fig3_res = fig1_results[i_result_fig3];
      // If the two wheels match, don't do a damn thing.
      if (fig3_res.wheelA !== fig3_res.wheelB){
        // If the two wheels have matching colors, draw a rect around them.
        if (fig3_res.outcomeA === fig3_res.outcomeB){
          // Draw a rect!
          fig3_container.rect(triple_wheel_x_offset/2, 3*hub_radius).radius(4)
          .center(0, -40+i_row_fig3*3*hub_radius)
          .addClass('hidden-vars-backdrop')
          .style('stroke', 'gray');
        }
        // Create a row and put circles and text in it.     
        var fig3_row = fig3_container.group();
        fig3_row.circle().radius(hub_radius).center(-triple_wheel_x_offset/6, 0).addClass("result").addClass(fig3_res.outcomeA?'result-red':'result-black');
        fig3_row.circle().radius(hub_radius).center(triple_wheel_x_offset/6, 0).addClass("result").addClass(fig3_res.outcomeB?'result-red':'result-black');
        fig3_row.text(String(fig3_res.wheelA)).attr('font-size', '12px').x(-triple_wheel_x_offset/6).cy(0).addClass('result').animate(0).cy(0);
        fig3_row.text(String(fig3_res.wheelB)).attr('font-size', '12px').x(triple_wheel_x_offset/6).cy(0).addClass('result').animate(0).cy(0);
        // Use the row number here to position the row, not the index number, since not all results get rows here.
        fig3_row.dy(-40+i_row_fig3*3*hub_radius);
        // Increment the row number by one.
        i_row_fig3 = i_row_fig3 + 1;
      }
    }
    // Move the whole thing to the center.
    fig3_container.translate(center_x, center_y);


    ///// FIGURE 4 ////////
    // Creating an image of all the hidden vars.
    var fig4_group = fig4_canvas.group();
    // Draw a big ol' rect in there.
    var fig4_selection_rect_width = 160;
    var fig4_selection_rect_height = 100;
    fig4_group.rect(fig4_selection_rect_width, fig4_selection_rect_height).radius(4)
      .center(0, 0)
      .addClass('hidden-vars-backdrop');
    // Now loop over all the hidden variables.
    // Once again, Javascript does a halfway-decent Python impersonation.
    // A freelance astrophysicist could get used to this.
    for (var i_hv in all_hvs){
      // i_hv is the index, we want the hvs themselves too.
      var hv = all_hvs[i_hv];
      var hv_g = hidden_variable_constructor(hv, fig4_group);
      // We need some variables defining the center of the display of the hvs as a function of i_hv.
      var hv_center_x = -fig4_selection_rect_width/4 + Math.floor(i_hv/4)*fig4_selection_rect_width/2;
      var hv_center_y = -3*fig4_selection_rect_height/10 + (i_hv%4)*fig4_selection_rect_height/5;
      // Move the whole thing where it belongs.
      hv_g.translate(hv_center_x, hv_center_y);
    }
    // Move the whole thing to the center of the canvas.
    fig4_group.translate(center_x, center_y);


    ///// FIGURE 5 ////////
    // Creating an image of all the hidden vars, but with the two kinds of sets differentiated.
    var fig5_group = fig5_canvas.group();
    // A rect around the top row.
    fig5_group.rect(fig4_selection_rect_width, fig4_selection_rect_height/4).radius(4)
      .center(0, -3*fig4_selection_rect_height/10)
      .addClass('hidden-vars-backdrop')
      .style('stroke', 'gray');
    // And a rect around the bottom three rows.
    fig5_group.rect(fig4_selection_rect_width, 65).radius(4)
      .center(0, fig4_selection_rect_height/5)
      .addClass('hidden-vars-backdrop');
    // Text to label those two rects.
    // fig5_group.text('With mismatched wheels, these will have the same color 100% of the time...')
    // fig5_group.text('➔ 100% match with mismatched wheels')
    fig5_group.text('➔ All mismatched wheels are the same color.')
                .addClass('static-text').style('font-size', '6px').x(85).cy(-3*fig4_selection_rect_height/10);
    fig5_group.text('➔ 33% of mismatched wheels are the same color.')
                .addClass('static-text').style('font-size', '6px').x(85).cy(fig4_selection_rect_height/5);
    // Now loop over all the hidden variables.
    // Once again, Javascript does a halfway-decent Python impersonation.
    // A freelance astrophysicist could get used to this.
    for (var i_hv in all_hvs){
      // i_hv is the index, we want the hvs themselves too.
      var hv = all_hvs[i_hv];
      var hv_g = hidden_variable_constructor(hv, fig5_group);
      // We need some variables defining the center of the display of the hvs as a function of i_hv.
      var hv_center_x = -fig4_selection_rect_width/4 + Math.floor(i_hv/4)*fig4_selection_rect_width/2;
      // Put a little extra vertical space between the first row of HVs and the rest of the HVs.
      var hv_center_y = -3*fig4_selection_rect_height/10 + (i_hv%4)*fig4_selection_rect_height/5 + Math.ceil((i_hv%4)/4)*fig4_selection_rect_height/10;
      // Move the whole thing where it belongs.
      hv_g.translate(hv_center_x, hv_center_y);
    }
    // Move the whole thing to the correct spot on the canvas.
    fig5_group.translate(2*center_x/3, center_y);


    /////////////////////////////////////////////////////////
    //    CLOSING OUT FUNCTIONS AND LOADING EXTERNAL SVG   //
    /////////////////////////////////////////////////////////

    // Hey, remember how we're nested inside two functions?
    // We still need to break out of them.
    // First, we break out of the callback function that fires once all the external SVG has been loaded.
 
  };

  // Now that we've fully defined that callback function, we finally load all the external SVG files.
  // These are set up like dominoes: once one SVG loads, it fires off a callback function that loads the next one.
  // When the last SVG loads, it fires off the massive callback function defined immediately above.
  // This is also how the external SVG gets into those definition containers we created all the way back at the start.
  $("#dwheel").load("svg/wheel.svg #wheel", function(){  
    $("#dmachine").load("svg/fancy-machine.svg #machine", function(){
      $("#dselector").load("svg/selector.svg #selector", function(){
        $("#dpointer").load("svg/selector-pointer.svg #selector-pointer", load_callback);
      });
    });
  });

  // And finally, for our last trick, let's break out of that jQuery magic function we started at the beginning of all this.

});