/**
 * Parse Zoom VTT (WebVTT) transcript format into internal format
 *
 * Zoom VTT format example:
 * WEBVTT
 *
 * 1
 * 00:00:00.000 --> 00:00:05.000
 * Speaker Name: Transcript text here
 *
 * 2
 * 00:00:05.000 --> 00:00:10.000
 * Another Speaker: More text
 */

/**
 * Parse VTT content into structured transcript data
 * @param {string} vttContent - Raw VTT file content
 * @returns {object} Parsed transcript with text, speakers, and segments
 */
export function parseVttTranscript(vttContent) {
  if (!vttContent || typeof vttContent !== 'string') {
    return {
      text: '',
      speakers: [],
      segments: [],
      duration: '00:00:00.000'
    };
  }

  const lines = vttContent.split('\n');
  const speakers = new Set();
  const segments = [];
  let currentSegment = null;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    i++;

    // Skip WEBVTT header, NOTE lines, and empty lines
    if (line === 'WEBVTT' || line === '' || line.startsWith('NOTE') || /^\d+$/.test(line)) {
      continue;
    }

    // Timestamp line: "00:00:00.000 --> 00:00:05.000"
    if (line.includes('-->')) {
      const [start, end] = line.split('-->').map(t => t.trim().split(' ')[0]); // Remove any cue settings
      currentSegment = { start, end, text: '', speaker: null };
      continue;
    }

    // Content line (may have speaker attribution)
    if (currentSegment) {
      // Check for speaker attribution: "Speaker Name: text..."
      const speakerMatch = line.match(/^([^:]+):\s*(.*)$/);

      if (speakerMatch && !line.startsWith('http')) {
        // Has speaker attribution
        currentSegment.speaker = speakerMatch[1].trim();
        currentSegment.text = speakerMatch[2].trim();
        speakers.add(currentSegment.speaker);
      } else {
        // No speaker, or continuation of previous line
        if (currentSegment.text) {
          currentSegment.text += ' ' + line;
        } else {
          currentSegment.text = line;
        }
      }

      // Check if next line is empty or a cue number (end of this segment)
      const nextLine = lines[i]?.trim();
      if (!nextLine || /^\d+$/.test(nextLine) || nextLine.includes('-->')) {
        if (currentSegment.text) {
          segments.push({ ...currentSegment });
        }
        currentSegment = null;
      }
    }
  }

  // Don't forget the last segment
  if (currentSegment && currentSegment.text) {
    segments.push(currentSegment);
  }

  // Convert to format compatible with existing transcript processor
  // Format: "Speaker: text\nSpeaker: text\n..."
  const formattedText = segments
    .map(seg => seg.speaker ? `${seg.speaker}: ${seg.text}` : seg.text)
    .join('\n');

  // Calculate duration from last segment
  const duration = segments.length > 0
    ? segments[segments.length - 1].end
    : '00:00:00.000';

  return {
    text: formattedText,
    speakers: Array.from(speakers),
    segments,
    duration
  };
}

/**
 * Extract participant list from parsed transcript
 * @param {object} parsedTranscript - Output from parseVttTranscript
 * @returns {Array} Array of participant objects
 */
export function extractParticipants(parsedTranscript) {
  return parsedTranscript.speakers.map(name => ({
    name,
    email: null // Zoom VTT doesn't include emails
  }));
}

/**
 * Calculate transcript statistics
 * @param {object} parsedTranscript - Output from parseVttTranscript
 * @returns {object} Statistics about the transcript
 */
export function getTranscriptStats(parsedTranscript) {
  const segments = parsedTranscript.segments;
  const speakerCounts = {};

  for (const segment of segments) {
    const speaker = segment.speaker || 'Unknown';
    speakerCounts[speaker] = (speakerCounts[speaker] || 0) + 1;
  }

  return {
    totalSegments: segments.length,
    totalSpeakers: parsedTranscript.speakers.length,
    speakerSegmentCounts: speakerCounts,
    duration: parsedTranscript.duration,
    wordCount: parsedTranscript.text.split(/\s+/).length
  };
}

/**
 * Convert timestamp string to seconds
 * @param {string} timestamp - VTT timestamp "HH:MM:SS.mmm"
 * @returns {number} Time in seconds
 */
export function timestampToSeconds(timestamp) {
  const parts = timestamp.split(':');
  if (parts.length === 3) {
    const [hours, minutes, secondsMs] = parts;
    const [seconds, ms] = secondsMs.split('.');
    return (
      parseInt(hours) * 3600 +
      parseInt(minutes) * 60 +
      parseInt(seconds) +
      (parseInt(ms) || 0) / 1000
    );
  }
  return 0;
}

/**
 * Get transcript summary for a specific time range
 * @param {object} parsedTranscript - Output from parseVttTranscript
 * @param {number} startSeconds - Start time in seconds
 * @param {number} endSeconds - End time in seconds
 * @returns {string} Transcript text for the time range
 */
export function getTranscriptForTimeRange(parsedTranscript, startSeconds, endSeconds) {
  const relevantSegments = parsedTranscript.segments.filter(seg => {
    const segStart = timestampToSeconds(seg.start);
    const segEnd = timestampToSeconds(seg.end);
    return segEnd >= startSeconds && segStart <= endSeconds;
  });

  return relevantSegments
    .map(seg => seg.speaker ? `${seg.speaker}: ${seg.text}` : seg.text)
    .join('\n');
}
