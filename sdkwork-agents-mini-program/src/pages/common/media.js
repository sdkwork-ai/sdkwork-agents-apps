/**
 * Shared remote-media helpers for the asset and creative surfaces.
 *
 * Both surfaces render media the backend persisted to Drive, so playback and
 * document opening are identical. Platform APIs stay in this one file instead of
 * being repeated per page (`APP_MINI_PROGRAM_UI_SPEC.md` section 1).
 */

/**
 * Creates a single-track audio player bound to one page instance.
 *
 * Mini program audio playback is a platform context, not a component: the page
 * owns one instance and reuses it for every asset it opens.
 */
function createAudioPlayer() {
  let context = null;
  let currentUrl = "";
  let playing = false;

  function destroy() {
    if (context) {
      try {
        context.stop();
        context.destroy();
      } catch {
        // A context already released by the platform is not an error.
      }
    }
    context = null;
    currentUrl = "";
    playing = false;
  }

  return {
    /** Starts (or resumes) one URL; returns whether audio is now playing. */
    play(url, onEnded) {
      if (!url) {
        return false;
      }
      if (context && currentUrl === url) {
        context.play();
        playing = true;
        return true;
      }
      destroy();
      context = wx.createInnerAudioContext();
      context.src = url;
      currentUrl = url;
      context.onEnded(() => {
        playing = false;
        if (typeof onEnded === "function") onEnded();
      });
      context.onError(() => {
        playing = false;
        if (typeof onEnded === "function") onEnded();
      });
      context.play();
      playing = true;
      return true;
    },

    pause() {
      if (context) {
        context.pause();
      }
      playing = false;
    },

    toggle(url, onEnded) {
      if (context && currentUrl === url && playing) {
        this.pause();
        return false;
      }
      return this.play(url, onEnded);
    },

    stop: destroy,
  };
}

/**
 * Downloads a remote file into the temporary directory and opens it.
 *
 * `wx.openDocument` accepts the temp path for PDFs and office documents; the
 * caller shows its localized failure copy when this rejects.
 */
function openRemoteFile(url) {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error("A URL is required to open a remote file."));
      return;
    }
    wx.downloadFile({
      url,
      success: (result) => {
        wx.openDocument({
          filePath: result.tempFilePath,
          showMenu: true,
          success: resolve,
          fail: reject,
        });
      },
      fail: reject,
    });
  });
}

module.exports = { createAudioPlayer, openRemoteFile };
