# Wallpaper Engine Audio API Simulator

A simulation of Audio API for Wallpaper Engine

## Usage

Put the simulator script at the very beginning of your project like this,

```
	<script src="dist/wpesmu.min.js"></script>
```

and it's all done.

Note 1: Wave data may be different from that Wallpaper Engine passes to your project, but it's enough for debugging and testing. I'm sorry that I didn't figure out how Wallpaper Engine can get such dynamic waveform data, so if you have any idea about it, fell free to make a pull request.

Note 2: In JavaScript, tiny differences(less than 1/256) cannot be detected, but it's still enough for debugging and testing.

## License
[MIT](http://cos.mit-license.org/)
