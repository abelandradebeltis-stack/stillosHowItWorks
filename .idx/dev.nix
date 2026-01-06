
# To learn more about how to use Nix to configure your environment
# see: https://developers.google.com/idx/guides/customize-idx-env
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-24.05"; # or "unstable"
  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.python3
    pkgs.python3Packages.pip
    pkgs.python3Packages.flask
  ];
  # Sets environment variables in the workspace
  env = {
    FLASK_APP = "server.py";
    ADMIN_USERNAME = "administrator";
    ADMIN_PASSWORD = "still0S@2026Sys!!";
    # This key is used by Flask to keep sessions secure.
    # You can generate a new one using: openssl rand -hex 16
    SECRET_KEY = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6";
  };
  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      "google.gemini-cli-vscode-ide-companion"
    ];
    # Enable previews
    previews = {
      enable = true;
      previews = {
        web = {
          # Command to run your Flask server
          command = ["flask" "run" "--host" "0.0.0.0" "--port" "$PORT"];
          manager = "web";
        };
      };
    };
    # Workspace lifecycle hooks
    workspace = {
      # Runs when a workspace is first created
      onCreate = {
        # Open editors for the following files by default, if they exist:
        default.openFiles = [ ".idx/dev.nix" "README.md" "server.py" ];
      };
      # Runs when the workspace is (re)started
      onStart = {};
    };
  };
}
