'use strict'

import { log, info } from './debug.js'
import content from './main.html'
import './style.css'

const $ = selector => document.querySelector(selector)
let audioListener = arr => log('Merged arr', arr)

const registerAudioListener = (listener) => {
	audioListener = listener
}
window.wallpaperRegisterAudioListener = registerAudioListener

const audio = new Audio()
const ctx = new AudioContext()
const scriptL = ctx.createScriptProcessor(2048, 1, 1)
const scriptR = ctx.createScriptProcessor(2048, 1, 1)
const source = ctx.createMediaElementSource(audio)
const splitter = ctx.createChannelSplitter(2)
const analyserL = ctx.createAnalyser()
const analyserR = ctx.createAnalyser()
const fps = 30
const tg = 1000 / fps

let AFID = 0
let last = 0
let threshold = 0
let arrL = new Array(64)
let arrR = new Array(64)

analyserL.fftSize = 64
analyserR.fftSize = 64

source.connect(splitter)
splitter.connect(analyserL, 0, 0)
splitter.connect(analyserR, 1, 0)
scriptL.connect(analyserL)
scriptR.connect(analyserR)

scriptL.onaudioprocess = () => {
	const u8arr = new Uint8Array(analyserL.frequencyBinCount)
	analyserL.getByteFrequencyData(u8arr)
	arrL = Array.from(u8arr)
}
scriptR.onaudioprocess = () => {
	const u8arr = new Uint8Array(analyserR.frequencyBinCount)
	analyserL.getByteFrequencyData(u8arr)
	arrR = Array.from(u8arr)
}

source.connect(ctx.destination)

const start = () => {
	window.requestAnimationFrame(start)

	log('Raw arr', arrL, arrR)

	const now = performance.now()
	const dt = now - last
	last = now

	threshold += dt
	if (threshold > tg) threshold = 0
	else return

	audioListener(arrL.concat(arrR))
}

const init = () => {
	document.removeEventListener('DOMContentLoaded', init, false)

	$('body').insertAdjacentHTML('beforeend', content)

	const input = $('.wsmu.input')
	const playBtn = $('wsmu.btn.play')
	const pauseBtn = $('wsmu.btn.pause')
	const stopBtn = $('wsmu.btn.stop')

	input.addEventListener('change', () => {
		const fr = new FileReader()
		fr.onload = (e) => {
			log(e.target.result)
		}
	})

	playBtn.addEventListener('click', () => {
		start()
		audio.play()
	})
	pauseBtn.addEventListener('click', audio.pause)
	stopBtn.addEventListener('click', () => {
		window.cancelAnimationFrame(AFID)
		audio.pause()
		audio.currentTime = 0
	})

	audio.src = './test.mp3'

	info(`v{VERSION} Initialized!`)
}

document.addEventListener('DOMContentLoaded', init, false)
