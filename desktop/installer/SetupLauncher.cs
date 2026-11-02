using System;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

// Paint the installation window before reading the embedded package.
internal static class SetupLauncher
{
    private static readonly string LogPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "MagoStudioInstaller", "installer.log");

    private static bool IsSilent(string[] args)
    {
        return args.Any(arg => arg.Equals("--silent", StringComparison.OrdinalIgnoreCase)
            || arg.Equals("/silent", StringComparison.OrdinalIgnoreCase)
            || arg.Equals("-s", StringComparison.OrdinalIgnoreCase));
    }

    [STAThread]
    private static int Main(string[] args)
    {
        if (IsSilent(args)) return Install(args, false);
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        int exitCode = 1;
        using (var splashStream = Assembly.GetExecutingAssembly().GetManifestResourceStream("InstallerSplash"))
        using (var splash = Image.FromStream(splashStream))
        using (var window = new Form())
        {
            window.Text = "Installing Mago Studio";
            window.ClientSize = new Size(320, 320);
            window.StartPosition = FormStartPosition.CenterScreen;
            window.FormBorderStyle = FormBorderStyle.None;
            window.ControlBox = false;
            // Use a color absent from the artwork so the GIF's transparent
            // corners reveal the desktop without removing the cat's black pixels.
            window.BackColor = Color.Magenta;
            window.TransparencyKey = window.BackColor;
            window.ForeColor = Color.White;
            window.Font = new Font("Segoe UI", 10);
            using (var iconStream = Assembly.GetExecutingAssembly().GetManifestResourceStream("InstallerIcon"))
                window.Icon = new Icon(iconStream);
            var picture = new PictureBox {
                Image = splash,
                SizeMode = PictureBoxSizeMode.Normal,
                BackColor = Color.Transparent,
                Location = Point.Empty,
                Size = new Size(320, 320)
            };
            // Paint after the PictureBox draws each animated frame. A separate
            // transparent label would cover the GIF with the form background.
            picture.Paint += (sender, eventArgs) => {
                eventArgs.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
                using (var text = new GraphicsPath())
                using (var family = new FontFamily("Segoe UI"))
                using (var outline = new Pen(Color.Black, 3))
                using (var position = new Matrix())
                {
                    text.AddString("Installing Mago...", family, (int)FontStyle.Bold,
                        18, PointF.Empty, StringFormat.GenericDefault);
                    var bounds = text.GetBounds();
                    position.Translate((picture.Width - bounds.Width) / 2 - bounds.X,
                        284 - bounds.Y);
                    text.Transform(position);
                    outline.LineJoin = LineJoin.Round;
                    eventArgs.Graphics.DrawPath(outline, text);
                    eventArgs.Graphics.FillPath(Brushes.White, text);
                }
            };
            window.Controls.Add(picture);
            window.Shown += async (sender, eventArgs) => {
                await Task.Yield();
                exitCode = await Task.Run(() => Install(args, true));
                if (exitCode != 0)
                    MessageBox.Show(window,
                        "Installation could not finish.\n\nDiagnostic log: " + LogPath,
                        "Mago Studio installation failed", MessageBoxButtons.OK, MessageBoxIcon.Error);
                window.Close();
            };
            Application.Run(window);
        }
        return exitCode;
    }

    private static int Install(string[] args, bool launchApp)
    {
        string directory = Path.Combine(Path.GetTempPath(), "MagoStudioSetup-" + Guid.NewGuid().ToString("N"));
        try
        {
            Log("Preparing installer");
            Directory.CreateDirectory(directory);
            string installer = Path.Combine(directory, "Setup.exe");
            using (var payload = Assembly.GetExecutingAssembly().GetManifestResourceStream("InstallerPayload"))
            using (var output = new FileStream(installer, FileMode.CreateNew, FileAccess.Write, FileShare.None))
                payload.CopyTo(output);

            // Our window provides feedback. Squirrel runs silently so it cannot
            // show another splash or launch the app before installation returns.
            string arguments = String.Join(" ", args.Select(Quote));
            if (!IsSilent(args)) arguments += " --silent";
            Log("Starting installation");
            using (var child = Process.Start(new ProcessStartInfo(installer, arguments) {
                UseShellExecute = false,
                CreateNoWindow = true,
                WorkingDirectory = directory
            }))
            {
                child.WaitForExit();
                Log("Installer exited with code " + child.ExitCode);
                if (child.ExitCode != 0) return child.ExitCode;
            }
            if (launchApp)
            {
                string updater = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "MagoStudio", "Update.exe");
                using (var child = Process.Start(new ProcessStartInfo(updater,
                    "--processStart mago-studio.exe --process-start-args=--squirrel-firstrun") {
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WorkingDirectory = Path.GetDirectoryName(updater)
                }))
                {
                    child.WaitForExit();
                    if (child.ExitCode != 0) return child.ExitCode;
                }
                Log("Installation finished; application launched");
            }
            return 0;
        }
        catch (Exception error)
        {
            Log(error.ToString());
            return 1;
        }
        finally
        {
            // Only remove the unique temporary directory created above.
            try { if (Directory.Exists(directory)) Directory.Delete(directory, true); }
            catch (Exception error) { Log("Temporary installer cleanup: " + error.Message); }
        }
    }

    private static string Quote(string value)
    {
        var result = new StringBuilder("\"");
        int slashes = 0;
        foreach (char character in value)
        {
            if (character == '\\') { slashes++; continue; }
            result.Append('\\', character == '"' ? slashes * 2 + 1 : slashes);
            result.Append(character);
            slashes = 0;
        }
        result.Append('\\', slashes * 2);
        return result.Append('"').ToString();
    }

    private static void Log(string message)
    {
        try
        {
            Directory.CreateDirectory(Path.GetDirectoryName(LogPath));
            File.AppendAllText(LogPath, DateTime.UtcNow.ToString("o") + " " + message + Environment.NewLine);
        }
        catch { }
    }
}
