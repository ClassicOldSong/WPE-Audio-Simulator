/* global VERSION */
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
const source = ctx.createMediaElementSource(audio)
const splitter = ctx.createChannelSplitter()
const analyserL = ctx.createAnalyser()
const analyserR = ctx.createAnalyser()
const fps = 30
const tg = 1000 / fps

let raito = 0.5
let AFID = 0
let last = 0
let threshold = 0

analyserL.smoothingTimeConstant = 0
analyserR.smoothingTimeConstant = 0
analyserL.fftSize = 2048
analyserR.fftSize = 2048

source.connect(splitter)
splitter.connect(analyserL, 0, 0)
splitter.connect(analyserR, 1, 0)

source.connect(ctx.destination)

const update = () => {
	AFID = window.requestAnimationFrame(update)

	const now = performance.now()
	const dt = now - last
	last = now

	threshold += dt
	if (threshold > tg) threshold = 0
	else return

	const u8arrL = new Uint8Array(analyserL.frequencyBinCount)
	const u8arrR = new Uint8Array(analyserR.frequencyBinCount)
	analyserL.getByteFrequencyData(u8arrL)
	analyserR.getByteFrequencyData(u8arrR)
	const tarrL = Array.from(u8arrL)
	const tarrR = Array.from(u8arrR)
	const arrL = []
	const arrR = []
	for (let i = 0; i < 384; i += 6) {
		arrL.push(Math.pow((tarrL[i] + tarrL[i + 384]) / 256, 3) * Math.pow(0.9 + 2 * i / u8arrL.length, 2) * raito)
		arrR.push(Math.pow((tarrR[i] + tarrR[i + 384]) / 256, 3) * Math.pow(0.9 + 2 * i / u8arrR.length, 2) * raito)
	}

	audioListener(arrL.concat(arrR))
}

const init = () => {
	document.removeEventListener('DOMContentLoaded', init, false)

	$('body').insertAdjacentHTML('afterbegin', content)

	const input = $('.wsmu.input')
	const playBtn = $('.wsmu.btn.play')
	const pauseBtn = $('.wsmu.btn.pause')
	const stopBtn = $('.wsmu.btn.stop')

	input.addEventListener('change', (evt) => {
		const url = URL.createObjectURL(evt.target.files[0])
		if (audio.src) URL.revokeObjectURL(audio.src)
		audio.src = url
	})

	playBtn.addEventListener('click', () => {
		if (!AFID) update()
		audio.play()
	})
	pauseBtn.addEventListener('click', () => {
		audio.pause()
	})
	stopBtn.addEventListener('click', () => {
		audio.pause()
		audio.currentTime = 0
		window.cancelAnimationFrame(AFID)
		AFID = 0
	})

	info(`v${VERSION} Initialized!`)
}

document.addEventListener('DOMContentLoaded', init, false)
