include("Tektronix.js")

sic_gd_filter_points = 5;
sic_gd_filter_factor = 0.5;

function SiC_GD_Init(Port)
{
	TEK_PortInit(Port, 19200);
	TEK_Send("data:width 1");
	TEK_Send("data:encdg rpb");
	TEK_Send("data:start 1");
	TEK_Send("data:stop 2500");
}

function SiC_GD_GetChannelCurve(Channel)
{
	// read basic data
	var p_scale = TEK_Exec("ch" + Channel + ":scale?");
	var p_position = TEK_Exec("ch" + Channel + ":position?");
	
	// init data read
	TEK_Send("data:source ch" + Channel);
	
	// read curve
	var data_input = TEK_Exec("curve?");
	print("Channel " + Channel + " loaded");
	
	// validate data
	if ((data_input[0] != "#") || (data_input[1] != 4) || (data_input[2] != 2) ||
		(data_input[3] != 5) || (data_input[4] != 0) || (data_input[5] != 0))
	{
		print("Invalid CH" + Channel + " data.");
		return;
	}
	
	// adjust data
	var res = [];
	for (var i = 6; i < 2506; ++i)
		res[i - 6] = (data_input[i].charCodeAt(0) - 128 - p_position * 25) * p_scale / 25;
	
	return res;
}

function SiC_GD_GetTimeScale()
{
	return TEK_Exec("horizontal:main:scale?");
}

function SiC_GD_Filter(Data, ScaleI)
{
	var filtered_avg = [];
	var filtered_spl = [];
	
	// avg filtering
	for (var i = 0; i < (Data.length - Math.pow(sic_gd_filter_points, 2)); ++i)
	{
		var avg_point = 0;
		for (var j = i; j < (i + Math.pow(sic_gd_filter_points, 2)); j += sic_gd_filter_points)
			avg_point += Data[j];
		filtered_avg[i] = avg_point / sic_gd_filter_points;
	}
	
	// current shunt scale
	if (typeof ScaleI === 'undefined')
		var scale = 1;
	else
		var scale = ScaleI;
	
	// spline filtering
	for (var i = 0; i < (filtered_avg.length - 3); ++i)
	{
		filtered_spl[i] =	Math.pow(1 - sic_gd_filter_factor, 3) * filtered_avg[i] +
							3 * sic_gd_filter_factor * Math.pow(1 - sic_gd_filter_factor, 2) * filtered_avg[i + 1] +
							3 * Math.pow(sic_gd_filter_factor, 2) * (1 - sic_gd_filter_factor) * filtered_avg[i + 2] +
							Math.pow(sic_gd_filter_factor, 3) * filtered_avg[i + 3];
		
		filtered_spl[i] *= scale;
	}
	
	return filtered_spl;
}

function SiC_GD_AvgData(Data, Start, Counter)
{
	var res = 0;
	var res_counter = 0;
	
	for (var i = Start; i < (Start + Counter) && i < Data.length; ++i)
	{
		res += Data[i];
		++res_counter;
	}
	
	return (res / res_counter);
}

function SiC_GD_MIN(Data)
{
	var value = Data[0];
	var time;
	
	for (var i = 0; i < Data.length; ++i)
		if (Data[i] < value)
		{
			value = Data[i];
			time = i;
		}
	
	return {Value : value, Time : time};
}

function SiC_GD_MAX(Data)
{
	var value = Data[0];
	var time;
	
	for (var i = 0; i < Data.length; ++i)
		if (Data[i] > value)
		{
			value = Data[i];
			time = i;
		}
	
	return {Value : value, Time : time};
}

function SiC_GD_GetCurves(ChannelVg, ChannelVce, ChannelIce)
{
	var HScale  = SiC_GD_GetTimeScale();
	
	var DataVge = SiC_GD_Filter(SiC_GD_GetChannelCurve(ChannelVg));
	var DataVce = SiC_GD_Filter(SiC_GD_GetChannelCurve(ChannelVce));
	var DataIce = SiC_GD_Filter(SiC_GD_GetChannelCurve(ChannelIce), 40);
	
	return {Vge : DataVge, Vce : DataVce, Ice : DataIce, HScale : HScale};
}

function SiC_GD_GetCurvesEmuON()
{
	var HScale = 1e-7;
	
	var ch1 = load("data/ch1_on.csv");
	var ch2 = load("data/ch2_on.csv");
	var ch3 = load("data/ch3_on.csv");
	
	for (var i = 0; i < ch1.length; ++i)
	{
		ch1[i] = parseFloat(ch1[i]);
		ch2[i] = parseFloat(ch2[i]);
		ch3[i] = parseFloat(ch3[i]);
	}
	
	var DataVge = SiC_GD_Filter(ch1);
	var DataVce = SiC_GD_Filter(ch3, 10);
	var DataIce = SiC_GD_Filter(ch2, 50);
	
	return {Vge : DataVge, Vce : DataVce, Ice : DataIce, HScale : HScale};
}

function SiC_GD_GetCurvesEmuOFF()
{
	var HScale = 1e-7;
	
	var ch1 = load("data/ch1_off.csv");
	var ch2 = load("data/ch2_off.csv");
	var ch3 = load("data/ch3_off.csv");
	
	for (var i = 0; i < ch1.length; ++i)
	{
		ch1[i] = parseFloat(ch1[i]);
		ch2[i] = parseFloat(ch2[i]);
		ch3[i] = parseFloat(ch3[i]);
	}
	
	var DataVge = SiC_GD_Filter(ch1);
	var DataVce = SiC_GD_Filter(ch3, 10);
	var DataIce = SiC_GD_Filter(ch2, 50);
	
	return {Vge : DataVge, Vce : DataVce, Ice : DataIce, HScale : HScale};
}
