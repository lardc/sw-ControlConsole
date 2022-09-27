include("PrintStatus.js")

function ITU_Start(Voltage, Current)
{
	dev.w(128, Voltage)
	dev.w(129, Math.floor(Current))
	dev.w(130, Math.floor(Current % 1 * 1000))
	dev.c(100)
	
	while(dev.r(192) == 4)
		sleep(100)
	
	if(dev.r(192) == 3)
	{
		p('Voltage,      V: ' + dev.r(200))
		p('Current,     mA: ' + (dev.r(201) + dev.r(202) / 1000).toFixed(3))
		p('Current act, mA: ' + (dev.r(203) + dev.r(204) / 1000).toFixed(3))
		if(dev.r(195) == 1)
			p('Output current saturation')
	}
	else
		PrintStatus()
}

function ITU_PlotFull()
{
	var a = ITU_Read()
	var res = {v : a[1], i_ : [], vrms : a[4], irms : [], pwm : a[7], cosphi : []}
	for(var i = 0; i < a[1].length; i++)
	{
		res.i_.push(a[2][i] + a[3][i] / 1000)
		res.irms.push(a[5][i] + a[6][i] / 1000)
		res.cosphi[i] = a[8][i] / 1000
	}
	
	plot(res.pwm, 50, 0)
	plot(res.cosphi, 50, 0)
	plot2(res.vrms, res.irms, 50, 0)
	plot2(res.v, res.i_, 50, 0)
	
	return res
}

function ITU_PlotFast()
{
	var i_mA = dev.rafs(2)
	var i_uA = dev.rafs(3)
	var irms_mA = dev.rafs(5)
	var irms_uA = dev.rafs(6)
	var cosphi = dev.rafs(8)
	
	var i_ = [], irms = []
	for(var i = 0; i < i_mA.length; i++)
	{
		i_.push(i_mA[i] + i_uA[i] / 1000)
		irms.push(irms_mA[i] + irms_uA[i] / 1000)
		cosphi[i] /= 1000
	}
	
	plot(dev.rafs(7), 50, 0)
	plot(cosphi, 50, 0)
	plot2(dev.rafs(4), irms, 50, 0)
	plot2(dev.rafs(1), i_, 50, 0)
}

function ITU_TestOptics()
{
	var cnt = 0
	while(!anykey())
	{
		cnt++
		dev.c(11)
		dev.c(10)
		if(dev.r(230) == 0)
		{
			p(dev.r(231) + ', ' + dev.r(232) + ', ' + dev.r(233))
			p('count: ' + cnt)
			return
		}
	}
	
	p('count: ' + cnt)
}

function ITU_PrintDiag()
{
	for(var i = 0; i < 4; i++)
	{
		var reg_num = 230 + i
		p(reg_num + ': ' + dev.r(230 + i))
	}
}

function ITU_Read()
{
	var res = []
	for(var i = 1; i <= 8; i++)
		res[i] = []
	
	while(true)
	{
		dev.c(110);
		for(var i = 1; i <= 8; i++)
		{
			var data = dev.rafs(i)
			res[i] = res[i].concat(data)
		}
		
		if(data.length == 0)
			break
	}
	
	return res
}

function ITU_CalibrateRawOffset()
{
	var cnt = 1000, voltage = 0, current = 0
	for(var i = 0; i < cnt; i++)
	{
		dev.c(12)
		dev.c(10)
		if(dev.r(230) == 1)
		{
			voltage += dev.r(232)
			current += dev.r(233)
		}
		else
		{
			p('Optical interface error')
			return
		}
	}
	
	voltage = Math.floor(voltage / cnt)
	current = Math.floor(current / cnt)
	
	p('Voltage offset: ' + voltage)
	p('Current offset: ' + current)
	
	dev.w(0, voltage)
	dev.w(1, current)
}
