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
const ctx = new AudioContext()
const source = ctx.createMediaElementSource(audio)
const processor = ctx.createScriptProcessor(4096)
const splitter = ctx.createChannelSplitter()
const analyserL = ctx.createAnalyser()
const analyserR = ctx.createAnalyser()
const fps = 30
const tg = 1000 / fps

let raito = 0.6
let AFID = 0
let last = 0
let threshold = 0
let useMicrophone = false

const micBuffer = [new Float32Array(4096), new Float32Array(4096)]
analyserL.smoothingTimeConstant = 0
analyserR.smoothingTimeConstant = 0
analyserL.fftSize = 2048
analyserR.fftSize = 2048

const processMerge = ({inputBuffer, outputBuffer}) => {
	for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
		const inputData = inputBuffer.getChannelData(channel)
		const outputData = outputBuffer.getChannelData(channel)

		outputBuffer.copyToChannel(micBuffer[channel], channel)

		for (let sample = 0; sample < inputBuffer.length; sample++) outputData[sample] += inputData[sample]
	}
}

const processMic = ({inputBuffer}) => {
  for (let i = 0; i < inputBuffer.numberOfChannels; i++) inputBuffer.copyFromChannel(micBuffer[i], i)
}

processor.onaudioprocess = processMerge

const shiftCanvas = () => {
	const imageData = _ctx.getImageData(0, 0, canvas.width, canvas.height)
	canvas.width = canvas.width
	_ctx.putImageData(imageData, -1, 0)
}

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
	const tarrL = Array.from(f32arrL).slice(0, 512)
	const tarrR = Array.from(f32arrR).slice(0, 512)
	const arrL = []
	const arrR = []
	for (let i = 0; i < 512; i += 8) {
		arrL.push(Math.pow(tarrL.slice(i, i + 8).reduce(sum) / 1024 + 1, 2) * Math.pow(0.9 + 4 * i / f32arrL.length, 2) * raito)
		arrR.push(Math.pow(tarrR.slice(i, i + 8).reduce(sum) / 1024 + 1, 2) * Math.pow(0.9 + 4 * i / f32arrR.length, 2) * raito)
	}

	const scopeData = tarrR.concat(tarrL).reverse()

	shiftCanvas()
	for (let i in scopeData) {
		let opacity = (128 + scopeData[i]) / 128
		if (opacity < 0) opacity = 0
		_ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
		_ctx.fillRect(1023, i, 1, 1)
	}

	const outputData = arrL.reverse().concat(arrR.reverse())
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
	source.connect(processor)
	processor.connect(splitter)
	splitter.connect(analyserL, 0, 0)
	splitter.connect(analyserR, 1, 0)
	source.connect(ctx.destination)
	init()
	update()
}

const streamMic = (stream) => {
	const micctx = new AudioContext()
	const micProcessor = micctx.createScriptProcessor(4096)
	const userSource = micctx.createMediaStreamSource(stream)

	micProcessor.onaudioprocess = processMic
	userSource.connect(micProcessor)
	micProcessor.connect(micctx.destination)
	useMicrophone = true
}

const logReject = e => log('Rejected!', e)

const _init = () => {
	if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia({audio: true})
		.then(streamMic)
		.catch(logReject)
	else try {
		navigator.getUserMedia({audio: true}, streamMic, logReject)
	} catch (err) {
		log('Your browser doesn\'t support audio recording!', err)
	}

	connectAll()
}

document.addEventListener('DOMContentLoaded', _init, false)
