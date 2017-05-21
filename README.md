# Wallpaper Engine Audio API Simulator

A simulation of Audio API for Wallpaper Engine

Live [demo](https://classicoldsong.github.io/WPE-Audio-Simulator/)

## Usage

Put the simulator script at the very beginning of your project like this,

```
<script src="dist/wpesmu.min.js"></script>
```

and it's all done.

## What can it do?
+ Load an audio clip from your local storage and simulate the behavior of Wallpaper Engine
+ Use the microphone as the audio source
+ Show the spectrum of the audio

Note: Wave data may be different from that Wallpaper Engine passes to your project, but it's enough for debugging and testing. I'm sorry that I didn't figure out how Wallpaper Engine can get such dynamic waveform data, so if you have any idea about it, fell free to make a pull request.

## License
[MIT](http://cos.mit-license.org/)
