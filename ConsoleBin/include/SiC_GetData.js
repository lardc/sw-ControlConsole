include("Tektronix.js")

// Savitzky-Golay filter settings (window must be odd and greater than order)
sic_gd_filter_window = 51;
sic_gd_filter_order = 3;

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

// Savitzky-Golay weights: for each offset X0 from the window center (-m..0) returns
// the weights of the least squares polynomial fit evaluated at X0
function SiC_GD_SGWeights(Window, Order)
{
	var m = (Window - 1) / 2;
	var n = Order + 1;
	var res = [];
	
	// normal matrix A'A (x is scaled to [-1, 1] for conditioning)
	var M = [];
	for (var r = 0; r < n; ++r)
	{
		M[r] = [];
		for (var c = 0; c < n; ++c)
		{
			var sum = 0;
			for (var k = -m; k <= m; ++k)
				sum += Math.pow(k / m, r + c);
			M[r][c] = sum;
		}
	}
	
	for (var x0 = -m; x0 <= 0; ++x0)
	{
		// solve M * v = [1, x0, x0^2, ...] by Gauss elimination with pivoting
		var A = [];
		for (var r = 0; r < n; ++r)
		{
			A[r] = M[r].slice(0);
			A[r].push(Math.pow(x0 / m, r));
		}
		
		for (var c = 0; c < n; ++c)
		{
			var piv = c;
			for (var r = c + 1; r < n; ++r)
				if (Math.abs(A[r][c]) > Math.abs(A[piv][c]))
					piv = r;
			var tmp = A[c]; A[c] = A[piv]; A[piv] = tmp;
			
			for (var r = 0; r < n; ++r)
			{
				if (r == c)
					continue;
				var f = A[r][c] / A[c][c];
				for (var k = c; k <= n; ++k)
					A[r][k] -= f * A[c][k];
			}
		}
		
		var v = [];
		for (var r = 0; r < n; ++r)
			v[r] = A[r][n] / A[r][r];
		
		var w = [];
		for (var k = -m; k <= m; ++k)
		{
			var wk = 0;
			for (var r = 0; r < n; ++r)
				wk += v[r] * Math.pow(k / m, r);
			w.push(wk);
		}
		res.push(w);
	}
	
	return res;
}

function SiC_GD_Filter(Data, ScaleI)
{
	if (Data.length == 0)
		return [];
	
	// current shunt scale
	var scale
	if (typeof ScaleI === 'undefined')
		scale = 1;
	else
		scale = ScaleI;
	
	var window = sic_gd_filter_window;
	if (window % 2 == 0)
		++window;
	
	var raw = [];
	for (var i = 0; i < Data.length; ++i)
		raw[i] = parseFloat(Data[i]);
	
	var filtered = [];
	
	// not enough data for the filter
	if (window > raw.length || sic_gd_filter_order >= window)
	{
		for (var i = 0; i < raw.length; ++i)
			filtered[i] = raw[i] * scale;
		return filtered;
	}
	
	var m = (window - 1) / 2;
	var weights = SiC_GD_SGWeights(window, sic_gd_filter_order);
	
	// Savitzky-Golay filtering; the first and the last m points use the
	// polynomial fitted to the first and the last window respectively
	for (var i = 0; i < raw.length; ++i)
	{
		var start, w;
		if (i < m)
		{
			start = 0;
			w = weights[i];
		}
		else if (i >= raw.length - m)
		{
			start = raw.length - window;
			w = weights[raw.length - 1 - i].slice(0).reverse();
		}
		else
		{
			start = i - m;
			w = weights[m];
		}
		
		var sum = 0;
		for (var k = 0; k < window; ++k)
			sum += w[k] * raw[start + k];
		filtered[i] = sum * scale;
	}
	
	return filtered;
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

function SiC_GD_SetEmuSettings(FileNumber)
{
	var NameStr = "0000" + FileNumber;
	NameStr = "F" + (NameStr).substr(NameStr.length - 4) + "CH";
	
	sic_gd_emu_name_vge = NameStr + sic_ch_vge + ".CSV";
	sic_gd_emu_name_vce = NameStr + sic_ch_vce + ".CSV";
	sic_gd_emu_name_ice = NameStr + sic_ch_ice + ".CSV";
	
	sic_gd_emu = true;
}

function SiC_GD_ParseTekCSV(FileName)
{
	var FilePath = "data\\" + FileName;
	
	if (!exists(FilePath))
		return [];
	
	var data = loadn(FilePath);
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
