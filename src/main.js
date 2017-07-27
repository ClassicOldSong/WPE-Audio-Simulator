/* global VERSION */
'use strict'

import { log, info } from './debug.js'
import content from './main.html'
import './style.css'

const $ = selector => document.querySelector(selector)
let canvas = null
let _ctx = null
let audioListener = arr => log('Data received!', arr)

const registerAudioListener = (listener) => {
	audioListener = listener
}
window.wallpaperRegisterAudioListener = registerAudioListener

const audio = new Audio()
const ctx = new (window.AudioContext || window.webkitAudioContext)()
const source = ctx.createMediaElementSource(audio)
const splitter = ctx.createChannelSplitter()
const analyserL = ctx.createAnalyser()
const analyserR = ctx.createAnalyser()
const TDBL = analyserL.maxDecibels - analyserL.minDecibels
const TDBR = analyserR.maxDecibels - analyserR.minDecibels
const fps = 30
const tg = 1000 / fps

let raito = 0.6
let AFID = 0
let last = 0
let threshold = 0
let useMicrophone = false

analyserL.smoothingTimeConstant = 0
analyserR.smoothingTimeConstant = 0
analyserL.fftSize = 2048
analyserR.fftSize = 2048

const shiftCanvas = () => {
	const imageData = _ctx.getImageData(0, 0, canvas.width, canvas.height)
	canvas.width = canvas.width
	_ctx.putImageData(imageData, -1, 0)
}

const getRawL = i => (i + TDBL) / TDBL
const getRawR = i => (i + TDBR) / TDBR
const sum = (l, r) => l + r

const update = () => {
	AFID = window.requestAnimationFrame(update)

	const now = performance.now()
	const dt = now - last
	last = now

	threshold += dt
	if (threshold <= tg) return
	threshold = 0

	const f32arrL = new Float32Array(analyserL.frequencyBinCount)
	const f32arrR = new Float32Array(analyserR.frequencyBinCount)
	analyserL.getFloatFrequencyData(f32arrL)
	analyserR.getFloatFrequencyData(f32arrR)
	const tarrL = Array
		.from(f32arrL)
		.slice(0, 512)
		.map(getRawL)
	const tarrR = Array
		.from(f32arrR)
		.slice(0, 512)
		.map(getRawR)
	const arrL = []
	const arrR = []
	for (let i = 0; i < 256; i += 4) {
		arrL.push(tarrL.slice(i, i + 4)
			.reduce(sum) / 4 * Math.pow(0.9 + 4 * i / f32arrL.length, 2) * raito)
		arrR.push(tarrR.slice(i, i + 8)
			.reduce(sum) / 4 * Math.pow(0.9 + 4 * i / f32arrR.length, 2) * raito)
	}

	const scopeData = tarrR
		.concat(tarrL)
		.reverse()

	shiftCanvas()
	for (let i in scopeData) {
		let opacity = scopeData[i]
		if (opacity < 0) opacity = 0
		if (opacity < 0) log('<0')
		_ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
		_ctx.fillRect(1023, i, 1, 1)
	}

	const outputData = arrL.concat(arrR)
		.map((item) => {
			if (item < 0 || item === Infinity) return 0
			return item
		})
	audioListener(outputData)
}

const init = () => {
	document.removeEventListener('DOMContentLoaded', init, false)

	$('body').insertAdjacentHTML('afterbegin', content)

	const input = $('.wsmu.input')
	const playBtn = $('.wsmu.btn.play')
	const pauseBtn = $('.wsmu.btn.pause')
	const stopBtn = $('.wsmu.btn.stop')
	canvas = $('.wsmu.canvas')
	_ctx = canvas.getContext('2d')

	if (useMicrophone) update()
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

const connectAll = () => {
	source.connect(splitter)
	splitter.connect(analyserL, 0, 0)
	splitter.connect(analyserR, 1, 0)
	source.connect(ctx.destination)
	init()
	update()
}

const streamMic = (stream) => {
	const userSource = ctx.createMediaStreamSource(stream)

	userSource.connect(splitter)
	useMicrophone = true
}

const logReject = e => log('Rejected!', e)

const _init = () => {
	connectAll()
	if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia({audio: true})
		.then(streamMic)
		.catch(logReject)
	else try {
		navigator.getUserMedia({audio: true}, streamMic, logReject)
	} catch (err) {
		log('Your browser doesn\'t support audio recording!', err)
	}
}

document.addEventListener('DOMContentLoaded', _init, false)
