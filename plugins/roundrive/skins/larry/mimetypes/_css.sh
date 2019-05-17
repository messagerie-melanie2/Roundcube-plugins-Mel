#!/usr/bin/perl

my %aliases = (
    'application_vnd_ms_word' => [
        'application_msword',
    ],
    'application_pgp_keys' => [
        'application_pkcs7_mime',
    ],
    'application_pgp_signature' => [
        'application_pkcs7_signature',
    ],
    'application_x_archive' => [
        'application_x_ar',
        'application_x_cpio',
    ],
    'application_zip' => [
        'application_x_7z_compressed',
        'application_x_ace',
        'application_x_arc',
        'application_x_arj',
        'application_x_bzip_compressed_tar',
        'application_x_lha',
        'application_x_rar',
        'application_x_tarz',
        'application_x_tzo',
        'application_x_zip',
        'application_x_zoo',
    ],
    'audio_midi' => [
        'audio_prs_sid',
    ],
    'audio_x_wav' => [
        'audio_x_aiff',
    ],
    'image' => [
        'application_vnd_stardivision_draw',
        'application_vnd_sun_xml_draw',
        'application_vnd_sun_xml_draw_template',
    ],
    'pdf' => [
        'application_pdf',
    ],
    'uri_mms' => [
        'uri_mmst',
        'uri_mmsu',
        'uri_pnm',
        'uri_rtspt',
        'uri_rtspu',
    ],
    'text_enriched' => [
        'text_rtf',
    ],
);

opendir(DIR, '.');
@FILES = readdir(DIR);

open(FILE, '>style.css');

$x = 0;
while ($FILES[$x]) {
    my $file = $FILES[$x];
    my $class = $file;
    my $line = '';

    if ($file =~ /^\./) {
        $x++;
        next;
    }

    $class =~ s/\.png$//;
    $class =~ s/[^a-z0-9_]/_/g;

    $line .= "#filelist tbody td.filename." .$class . " span";

    for my $alias (@{$aliases{$class}}) {
        $line .= ",\n#filelist tbody td.filename." .$alias . " span";
    }

    $line .= " {\n  background: url($file) 0 0 no-repeat;\n";
    $line .= "}\n";

    print FILE $line;
    $x++;
}
