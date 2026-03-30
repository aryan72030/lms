    <style>
        @page {
            /* Non-zero page margin prevents PDF viewers/printers from clipping edges */
            margin: 18mm 18mm 22mm 18mm; /* extra bottom margin */
            size: A4 landscape;
        }

        html, body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: 'serif';
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            color: #1a2a3a;
            overflow: hidden;
        }
        
        /* Main Container: Ultra-safe height for A4 Landscape */
        .page {
            width: 100%;
            height: 100%;
            padding: 0;
            margin: 0;
            position: relative;
            overflow: hidden;
            box-sizing: border-box;
            page-break-after: avoid;
        }

        /* Watermark Background */
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 150pt;
            color: #f0f0f0;
            opacity: 0.15;
            z-index: -1;
            font-weight: bold;
            white-space: nowrap;
        }

        /* Sophisticated Triple Border Layout (absolute insets to avoid page overflow) */
        .border-1 {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 2mm; /* lift bottom line to avoid clipping */
            border: 2pt solid #c5a059;
            box-sizing: border-box;
        }

        .border-2 {
            position: absolute;
            top: 3mm;
            left: 3mm;
            right: 3mm;
            bottom: 3mm;
            border: 7pt solid #1a2a3a;
            box-sizing: border-box;
        }

        .border-3 {
            position: absolute;
            top: 3mm;
            left: 3mm;
            right: 3mm;
            bottom: 3mm;
            border: 1pt solid #c5a059;
            box-sizing: border-box;
            background: #ffffff;
            overflow: hidden;
        }

        /* Decorative Corners */
        .corner {
            position: absolute;
            width: 12mm;
            height: 12mm;
            border: 1.5pt solid #c5a059;
            z-index: 5;
        }
        .corner-tl { top: 0; left: 0; border-right: 0; border-bottom: 0; }
        .corner-tr { top: 0; right: 0; border-left: 0; border-bottom: 0; }
        .corner-bl { bottom: 0; left: 0; border-right: 0; border-top: 0; }
        .corner-br { bottom: 0; right: 0; border-left: 0; border-top: 0; }

        /* Content Area - Shifted slightly up */
        .content {
            padding-top: 14mm;
            text-align: center;
        }

        .header-logo {
            font-size: 13pt;
            font-weight: bold;
            letter-spacing: 4pt;
            text-transform: uppercase;
            margin-bottom: 5mm;
            color: #1a2a3a;
        }

        .main-title {
            font-size: 44pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 7pt;
            margin: 0;
            color: #1a2a3a;
        }

        .sub-title {
            font-size: 11pt;
            font-style: italic;
            margin-top: 1mm;
            margin-bottom: 12mm;
            color: #555;
        }

        .label {
            font-size: 10pt;
            margin-bottom: 6mm;
            color: #333;
        }

        .student-name {
            font-size: 42pt;
            color: #c5a059;
            font-style: italic;
            margin: 0;
            text-transform: lowercase;
            letter-spacing: 1.5pt;
        }

        .underline {
            width: 140mm;
            height: 0.5pt;
            background: #e0e0e0;
            margin: 2mm auto 10mm;
        }

        .course-info {
            font-size: 11pt;
            max-width: 80%;
            margin: 0 auto;
            color: #333;
            line-height: 1.4;
        }

        .course-name {
            font-size: 20pt;
            font-weight: bold;
            display: block;
            margin-top: 2mm;
            text-transform: lowercase;
            color: #1a2a3a;
        }

        /* Footer - Positioned much higher from bottom to prevent cutting */
        .footer {
            position: absolute;
            bottom: 18mm;
            left: 20mm;
            right: 20mm;
            width: calc(100% - 40mm);
        }

        .footer-table {
            width: 100%;
            border-collapse: collapse;
        }

        .meta {
            text-align: left;
            font-size: 8pt;
            color: #666;
            line-height: 1.4;
        }

        .seal-wrap {
            text-align: center;
        }

        .seal {
            width: 32mm;
            height: 32mm;
            border: 1pt solid #c5a059;
            border-radius: 50%;
            margin: 0 auto;
            color: #c5a059;
            font-weight: bold;
            font-size: 8pt;
            padding-top: 10mm;
            box-sizing: border-box;
            transform: rotate(-5deg);
            background: white;
        }

        .signature {
            text-align: right;
        }

        .sig-line {
            border-top: 1.2pt solid #1a2a3a;
            width: 50mm;
            margin: 0 0 2mm auto;
        }

        .sig-name {
            font-size: 10pt;
            font-weight: bold;
            text-transform: uppercase;
            color: #1a2a3a;
        }

        .sig-title {
            font-size: 8pt;
            color: #666;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="watermark">LMS ACADEMY</div>
        <div class="border-1">
            <div class="border-2">
                <div class="border-3">
                    <div class="corner corner-tl"></div>
                    <div class="corner corner-tr"></div>
                    <div class="corner corner-bl"></div>
                    <div class="corner corner-br"></div>
                    
                    <div class="content">
                        <div class="header-logo">LMS Academy</div>
                        <h1 class="main-title">Certificate</h1>
                        <p class="sub-title">of Completion</p>

                        <p class="label">This is to certify that</p>
                        <h2 class="student-name">{{ $student_name }}</h2>
                        <div class="underline"></div>

                        <p class="course-info">
                            has successfully completed all the requirements for the course
                            <span class="course-name">{{ $course_title }}</span>
                        </p>
                    </div>

                    <div class="footer">
                        <table class="footer-table" cellspacing="0" cellpadding="0">
                            <tr>
                                <td width="35%" valign="bottom">
                                    <div class="meta">
                                        CERTIFICATE ID: {{ $certificate_id }}<br>
                                        ISSUE DATE: {{ $issue_date }}<br>
                                        COURSE DURATION: {{ $course_duration }}
                                    </div>
                                </td>
                                <td width="30%" valign="bottom">
                                    <div class="seal-wrap">
                                        <div class="seal">
                                            OFFICIAL<br>GRADUATE<br>{{ date('Y') }}
                                        </div>
                                    </div>
                                </td>
                                <td width="35%" valign="bottom">
                                    <div class="signature">
                                        <div style="font-size: 10pt; font-weight: bold; margin-bottom: 2mm; text-transform: uppercase; color: #1a2a3a;">{{ $instructor_name }}</div>
                                        <div class="sig-line"></div>
                                        <div class="sig-name">INSTRUCTOR</div>
                                        <div class="sig-title">Course Instructor</div>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </div>

                </div>
            </div>
        </div>
    </div>
</body>
