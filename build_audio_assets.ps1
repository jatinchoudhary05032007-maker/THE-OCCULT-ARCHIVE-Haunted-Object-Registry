$code = @'
using System;
using System.IO;
using System.Text;

public class HorrorAudioBuilder {
    const int SAMPLE_RATE = 22050;

    public static void SaveWav(string filePath, float[] samples) {
        int numSamples = samples.Length;
        int subChunk2Size = numSamples * 2;
        int chunkSize = 36 + subChunk2Size;

        using (FileStream fs = File.Create(filePath))
        using (BinaryWriter bw = new BinaryWriter(fs)) {
            bw.Write(Encoding.ASCII.GetBytes("RIFF"));
            bw.Write(chunkSize);
            bw.Write(Encoding.ASCII.GetBytes("WAVE"));
            
            bw.Write(Encoding.ASCII.GetBytes("fmt "));
            bw.Write(16);
            bw.Write((short)1); // PCM
            bw.Write((short)1); // Mono
            bw.Write(SAMPLE_RATE);
            bw.Write(SAMPLE_RATE * 2);
            bw.Write((short)2);
            bw.Write((short)16);

            bw.Write(Encoding.ASCII.GetBytes("data"));
            bw.Write(subChunk2Size);

            for (int i = 0; i < numSamples; i++) {
                float s = samples[i];
                if (s > 0.999f) s = 0.999f;
                else if (s < -0.999f) s = -0.999f;
                short val = (short)(s * 32767.0f);
                bw.Write(val);
            }
        }
    }

    // 1. Haunted Mansion Ambience (12s loop)
    public static void BuildMansionAmbience(string path) {
        int length = SAMPLE_RATE * 12;
        float[] s = new float[length];
        Random rnd = new Random(1894);

        // Wind noise state
        float b0 = 0, b1 = 0, b2 = 0;

        for (int i = 0; i < length; i++) {
            float t = (float)i / SAMPLE_RATE;

            // Deep Cathedral Drone: 52Hz + 78Hz + 104Hz with beat frequency
            float drone = (float)(
                Math.Sin(2 * Math.PI * 52.0 * t) * 0.28 +
                Math.Sin(2 * Math.PI * 78.2 * t) * 0.16 +
                Math.Sin(2 * Math.PI * 104.1 * t) * 0.10 +
                Math.Sin(2 * Math.PI * 34.6 * t) * 0.20
            );

            // Mansion Wind: Pink/Brown noise with undulating resonance
            float white = (float)(rnd.NextDouble() * 2.0 - 1.0);
            b0 = 0.99f * b0 + white * 0.05f;
            b1 = 0.96f * b1 + b0 * 0.08f;
            b2 = 0.92f * b2 + b1 * 0.12f;
            float windMod = (float)(0.6 + 0.4 * Math.Sin(2 * Math.PI * 0.18 * t));
            float wind = b2 * windMod * 0.35f;

            // Eerie distant organ tone (minor 9th dissonance)
            float eerie = (float)(Math.Sin(2 * Math.PI * 415.3 * t) * Math.Sin(2 * Math.PI * 0.12 * t)) * 0.04f;

            // Combine
            float mix = drone + wind + eerie;

            // Seamless loop crossfade (1s fade-in/fade-out at edges)
            float fade = 1.0f;
            if (t < 1.0f) fade = t;
            else if (t > 11.0f) fade = 12.0f - t;

            s[i] = mix * fade;
        }

        SaveWav(path, s);
    }

    // 2. Dark Void Drone (12s loop)
    public static void BuildDarkDrone(string path) {
        int length = SAMPLE_RATE * 12;
        float[] s = new float[length];
        Random rnd = new Random(1984);
        float nState = 0;

        for (int i = 0; i < length; i++) {
            float t = (float)i / SAMPLE_RATE;

            // Sub-basalt 42Hz + 63Hz void resonance
            float sub = (float)(
                Math.Sin(2 * Math.PI * 42.0 * t) * 0.35 +
                Math.Sin(2 * Math.PI * 63.3 * t) * 0.22 +
                Math.Sin(2 * Math.PI * 84.0 * t) * 0.12 +
                Math.Sin(2 * Math.PI * 28.0 * t) * 0.25
            );

            // Low frequency rumble
            float white = (float)(rnd.NextDouble() * 2.0 - 1.0);
            nState = (nState + (0.02f * white)) / 1.02f;
            float rumble = nState * 0.25f;

            // Slow pulsation LFO
            float lfo = (float)(0.75 + 0.25 * Math.Cos(2 * Math.PI * 0.25 * t));

            float fade = 1.0f;
            if (t < 1.0f) fade = t;
            else if (t > 11.0f) fade = 12.0f - t;

            s[i] = (sub * lfo + rumble) * fade;
        }

        SaveWav(path, s);
    }

    // 3. Thunder Effect (3.5s)
    public static void BuildThunder(string path) {
        int length = (int)(SAMPLE_RATE * 3.5);
        float[] s = new float[length];
        Random rnd = new Random(666);
        float brown = 0;

        for (int i = 0; i < length; i++) {
            float t = (float)i / SAMPLE_RATE;
            float white = (float)(rnd.NextDouble() * 2.0 - 1.0);
            brown = (brown + 0.035f * white) / 1.035f;

            // Heavy strike envelope with secondary rumbles
            float env = 0;
            if (t < 0.12f) env = t / 0.12f;
            else if (t < 0.6f) env = 1.0f - (t - 0.12f) * 0.3f;
            else if (t < 1.4f) env = 0.85f * (float)Math.Exp(-(t - 0.6f) * 1.5) + (float)(0.25 * Math.Sin(2 * Math.PI * 4.0 * t));
            else env = 0.5f * (float)Math.Exp(-(t - 1.4f) * 1.8);

            // Sub-bass resonance (55Hz - 38Hz sweep)
            float freq = 65.0f - (t * 8.0f);
            float lowSine = (float)Math.Sin(2 * Math.PI * freq * t) * 0.3f;

            s[i] = (brown * 0.65f + lowSine) * env * 0.9f;
        }

        SaveWav(path, s);
    }

    // 4. Lightning Snap (0.5s)
    public static void BuildLightning(string path) {
        int length = (int)(SAMPLE_RATE * 0.5);
        float[] s = new float[length];
        Random rnd = new Random(777);

        for (int i = 0; i < length; i++) {
            float t = (float)i / SAMPLE_RATE;
            float white = (float)(rnd.NextDouble() * 2.0 - 1.0);
            float env = (float)Math.Exp(-t * 22.0); // fast crack snap

            // High voltage ionization sizzle
            float snap = (float)(white * env * 0.85 + Math.Sin(2 * Math.PI * 1850 * t) * env * 0.3);
            s[i] = snap;
        }

        SaveWav(path, s);
    }

    // 5. Old Wooden Door Creak (1.4s)
    public static void BuildDoorCreak(string path) {
        int length = (int)(SAMPLE_RATE * 1.4);
        float[] s = new float[length];
        Random rnd = new Random(101);

        for (int i = 0; i < length; i++) {
            float t = (float)i / SAMPLE_RATE;
            // Friction stick-slip modulation
            float friction = (float)(Math.Sin(2 * Math.PI * 28.0 * t) * 0.5 + 0.5);
            float freq = 420.0f + (float)Math.Sin(2 * Math.PI * 3.5 * t) * 140.0f;
            float woodResonance = (float)(
                Math.Sin(2 * Math.PI * freq * t) * 0.35 +
                Math.Sin(2 * Math.PI * (freq * 1.48f) * t) * 0.2
            );

            float crackle = (float)(rnd.NextDouble() > 0.88 ? 0.4 : 0.0);
            float env = (float)Math.Sin(Math.PI * (t / 1.4f));

            s[i] = (woodResonance * friction + crackle) * env * 0.45f;
        }

        SaveWav(path, s);
    }

    // 6. Corridor Footsteps (2.2s)
    public static void BuildFootsteps(string path) {
        int length = (int)(SAMPLE_RATE * 2.2);
        float[] s = new float[length];

        float[] stepTimes = new float[] { 0.2f, 0.95f, 1.7f };
        for (int i = 0; i < length; i++) {
            float t = (float)i / SAMPLE_RATE;
            float total = 0;

            foreach (float st in stepTimes) {
                if (t >= st && t < st + 0.35f) {
                    float dt = t - st;
                    float thump = (float)(Math.Sin(2 * Math.PI * 75.0 * dt) * Math.Exp(-dt * 18.0));
                    float scrape = (float)(Math.Sin(2 * Math.PI * 360.0 * dt) * Math.Exp(-dt * 32.0));
                    total += (thump * 0.5f + scrape * 0.25f);
                }
            }

            s[i] = total * 0.55f;
        }

        SaveWav(path, s);
    }

    // 7. Eerie Whisper (1.8s)
    public static void BuildWhisper(string path) {
        int length = (int)(SAMPLE_RATE * 1.8);
        float[] s = new float[length];
        Random rnd = new Random(333);
        float lp = 0;

        for (int i = 0; i < length; i++) {
            float t = (float)i / SAMPLE_RATE;
            float white = (float)(rnd.NextDouble() * 2.0 - 1.0);

            // Formant bandpass
            lp = (lp + 0.2f * white) / 1.2f;
            float formant1 = (float)Math.Sin(2 * Math.PI * 1150 * t);
            float formant2 = (float)Math.Sin(2 * Math.PI * 2600 * t);
            float breath = lp * (formant1 * 0.4f + formant2 * 0.3f);

            // Envelope sigh
            float env = (float)Math.Sin(Math.PI * (t / 1.8f));
            s[i] = breath * env * 0.4f;
        }

        SaveWav(path, s);
    }

    // 8. Containment Breach Alarm (2.4s)
    public static void BuildContainmentAlarm(string path) {
        int length = (int)(SAMPLE_RATE * 2.4);
        float[] s = new float[length];

        for (int i = 0; i < length; i++) {
            float t = (float)i / SAMPLE_RATE;
            // 3 sweeps
            float cycle = t % 0.8f;
            float freq = 620.0f + (cycle / 0.8f) * 340.0f;
            float saw = (float)((t * freq) % 1.0 * 2.0 - 1.0);
            float env = cycle < 0.7f ? 1.0f : (1.0f - (cycle - 0.7f) / 0.1f);

            s[i] = saw * env * 0.35f;
        }

        SaveWav(path, s);
    }

    // 9. Artifact Discovery Sound (2.0s)
    public static void BuildArtifactDiscovery(string path) {
        int length = (int)(SAMPLE_RATE * 2.0);
        float[] s = new float[length];

        for (int i = 0; i < length; i++) {
            float t = (float)i / SAMPLE_RATE;
            // Low sub impact + singing bowl chord (220, 330, 440, 554)
            float sub = (float)(Math.Sin(2 * Math.PI * 55.0 * t) * Math.Exp(-t * 2.5));
            float chime1 = (float)(Math.Sin(2 * Math.PI * 220.0 * t) * Math.Exp(-t * 1.4));
            float chime2 = (float)(Math.Sin(2 * Math.PI * 330.0 * t) * Math.Exp(-t * 1.6));
            float chime3 = (float)(Math.Sin(2 * Math.PI * 440.0 * t) * Math.Exp(-t * 1.8));
            float chime4 = (float)(Math.Sin(2 * Math.PI * 554.3 * t) * Math.Exp(-t * 2.0));

            s[i] = (sub * 0.4f + chime1 * 0.2f + chime2 * 0.18f + chime3 * 0.12f + chime4 * 0.1f);
        }

        SaveWav(path, s);
    }

    // 10. Archival Confirmation (0.8s)
    public static void BuildArchiveConfirmation(string path) {
        int length = (int)(SAMPLE_RATE * 0.8);
        float[] s = new float[length];

        for (int i = 0; i < length; i++) {
            float t = (float)i / SAMPLE_RATE;
            // Mechanical lock click + deep resonance
            float click = (float)(Math.Sin(2 * Math.PI * 180.0 * t) * Math.Exp(-t * 16.0));
            float thud = (float)(Math.Sin(2 * Math.PI * 70.0 * t) * Math.Exp(-t * 7.0));
            float chime = (float)(Math.Sin(2 * Math.PI * 523.2 * t) * Math.Exp(-t * 9.0));

            s[i] = (click * 0.4f + thud * 0.45f + chime * 0.15f);
        }

        SaveWav(path, s);
    }
}
'@

Add-Type -TypeDefinition $code -Language CSharp

$outDir = "C:\Users\jatin\OneDrive\Desktop\anti gravity\assets\audio"
Write-Host "Synthesizing cinematic audio files to: $outDir"

[HorrorAudioBuilder]::BuildMansionAmbience("$outDir\ambience-haunted-mansion.wav")
[HorrorAudioBuilder]::BuildDarkDrone("$outDir\ambience-dark-drone.wav")
[HorrorAudioBuilder]::BuildThunder("$outDir\effect-thunder.wav")
[HorrorAudioBuilder]::BuildLightning("$outDir\effect-lightning.wav")
[HorrorAudioBuilder]::BuildDoorCreak("$outDir\effect-door-creak.wav")
[HorrorAudioBuilder]::BuildFootsteps("$outDir\effect-footsteps.wav")
[HorrorAudioBuilder]::BuildWhisper("$outDir\effect-whisper.wav")
[HorrorAudioBuilder]::BuildContainmentAlarm("$outDir\effect-containment-alarm.wav")
[HorrorAudioBuilder]::BuildArtifactDiscovery("$outDir\effect-artifact-discovery.wav")
[HorrorAudioBuilder]::BuildArchiveConfirmation("$outDir\effect-archive-confirmation.wav")

Get-ChildItem -Path $outDir | Select-Object Name, Length
