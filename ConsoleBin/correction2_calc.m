function correction2_calc(Dir, fileInput, fileFlag)
    % read input
    csv_input = dlmread(strcat(pwd, '\', Dir, '\', fileInput, '.csv'), ';');
    % calculate correction
    p = polyfit(csv_input(:, 1), csv_input(:, 2), 2);
    % write output
    f = fopen(strcat(pwd, '\', Dir, '\', fileInput, '_corr.csv'), 'w+');
    fprintf(f, '%.6f;%.3f;%.3f;', p(1), p(2), p(3));
    fclose(f);
    % write flag
    f = fopen(strcat(pwd, '\', Dir, '\', fileFlag), 'w+');
    fprintf(f, '%d;', 1);
    fclose(f);
end