include("Tektronix.js")

sic_gd_filter_points = 5;
sic_gd_filter_factor = 0.5;

sic_gd_vce_probe = 100;
sic_gd_ice_shunt = 2.5e-3;

sic_gd_emu = false;
sic_gd_emu_name_vge = "vge.csv";
sic_gd_emu_name_vce = "vce.csv";
sic_gd_emu_name_ice = "ice.csv";

function SiC_GD_Init(Port)
{
	TEK_PortInit(Port, 9600);
	TEK_Send("data:width 1");
	TEK_Send("data:encdg rpb");
	TEK_Send("data:start 1");
	TEK_Send("data:stop 2500");
}

function SiC_GD_GetChannelCurve(Channel)
{
	print("Считывание данных канала № " + Channel + "...");
	
	// read basic data
	var p_scale = TEK_Exec("ch" + Channel + ":scale?");
	var p_position = TEK_Exec("ch" + Channel + ":position?");
	
	// init data read
	TEK_Send("data:source ch" + Channel);
	
	// read curve
	var data_input = TEK_Exec("curve?");
	
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
	if (Data.length == 0)
		return [];
	
	var filtered_avg = [];
	var filtered_spl = [];
	
	// avg filtering
	for (var i = 0; i < (Data.length - Math.pow(sic_gd_filter_points, 2)); ++i)
	{
		var avg_point = 0;
		for (var j = i; j < (i + Math.pow(sic_gd_filter_points, 2)); j += sic_gd_filter_points)
			avg_point += parseFloat(Data[j]);
		filtered_avg[i] = avg_point / sic_gd_filter_points;
	}
	
	// current shunt scale
	var scale
	if (typeof ScaleI === 'undefined')
		scale = 1;
	else
		scale = ScaleI;
	
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

function SiC_GD_InvertData(Data)
{
	var res = []
	for (var i = 0; i < Data.length; ++i)
		res.push(-Data[i]);
	return res;
}

function SiC_GD_AvgData(Data, StartIndex, EndIndex)
{
	var res = 0;
	var res_counter = 0;
	
	for (var i = StartIndex; i <= EndIndex && i < Data.length; ++i)
	{
		res += Data[i];
		++res_counter;
	}
	
	return (res / res_counter);
}

function SiC_GD_MIN(Data)
{
	var value = Data[0];
	var index;
	
	for (var i = 0; i < Data.length; ++i)
		if (Data[i] < value)
		{
			value = Data[i];
			index = i;
		}
	
	return {Value : value, Index : index};
}

function SiC_GD_MAX(Data)
{
	var value = Data[0];
	var index;
	
	for (var i = 0; i < Data.length; ++i)
		if (Data[i] > value)
		{
			value = Data[i];
			index = i;
		}
	
	return {Value : value, Index : index};
}

function SiC_GD_GetCurves(ChannelVge, ChannelVce, ChannelIce)
{
	if (sic_gd_emu)
	{
		var vge = SiC_GD_ParseTekCSV(sic_gd_emu_name_vge);
		var vce = SiC_GD_ParseTekCSV(sic_gd_emu_name_vce);
		var ice = SiC_GD_ParseTekCSV(sic_gd_emu_name_ice);
		
		var hscale = SiC_GD_ParseTekHScale(sic_gd_emu_name_vce);
	}
	else
	{
		var vge = SiC_GD_VgeGetDataWrapper(ChannelVge);
		var vce = SiC_GD_GetChannelCurve(ChannelVce);
		var ice = SiC_GD_GetChannelCurve(ChannelIce);
		
		var hscale = SiC_GD_GetTimeScale();
	}
	
	var TimeStep = hscale / 250;
	
	var DataVge = SiC_GD_Filter(vge);
	var DataVce = SiC_GD_Filter(vce, sic_gd_vce_probe);
	var DataIce = SiC_GD_Filter(ice, 1 / sic_gd_ice_shunt);
	
	return {Vge : DataVge, Vce : DataVce, Ice : DataIce, TimeStep : TimeStep};
}

function SiC_GD_VgeGetDataWrapper(Channel)
{
	var SwitchedChannels = TEK_Exec("sel?").split(";");
	
	if (SwitchedChannels[Channel - 1] == '1')
		return SiC_GD_GetChannelCurve(Channel);
	else
		return [];
}

function SiC_GD_SetEmuSettings(VgeN, VceN, IceN)
{
	sic_gd_emu_name_vge = VgeN;
	sic_gd_emu_name_vce = VceN;
	sic_gd_emu_name_ice = IceN;
	
	sic_gd_emu = true;
}

function SiC_GD_ParseTekCSV(FileName)
{
	var data = loadn("data\\" + FileName);
	var result = [];
	
	for (var i = 0; i < data.length; ++i)
	{
		var raw = data[i].split(",");
		result.push(parseFloat(raw[4]));
	}
	
	return result;
}

function SiC_GD_ParseTekHScale(FileName)
{
	var data = loadn("data\\" + FileName);
	var raw = data[11].split(",");
	
	return parseFloat(raw[1]);
}
