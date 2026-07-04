// https://developers.google.com/youtube/v3/guides/implementation/videos

const { FetchClient, credsFromPayload, responseIfRejectingArgs } = require('../utils');
const { credsValidator } = require('../validators');

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

const parseChannelIdentifier = (channelIdentifier) => {
  const trimmed = channelIdentifier.trim();

  if (trimmed.startsWith('http')) {
    const url = new URL(trimmed);
    const handleMatch = url.pathname.match(/^\/@([^/]+)/);

    if (handleMatch) {
      return { handle: handleMatch[1] };
    }

    const channelMatch = url.pathname.match(/^\/channel\/([^/]+)/);

    if (channelMatch) {
      return { channelId: channelMatch[1] };
    }
  }

  if (trimmed.startsWith('@')) {
    return { handle: trimmed.slice(1) };
  }

  if (trimmed.startsWith('UC')) {
    return { channelId: trimmed };
  }

  return { handle: trimmed };
};

const youtubeClient = new FetchClient({
  requestPreparer: async (requestPayload, context) => {
    const { creds } = context;
    const { API_KEY } = creds;

    return {
      ...requestPayload,
      params: {
        key: API_KEY,
        ...requestPayload.params,
      },
    };
  },
  responseInterpreter: async (response) => {
    if (!response.ok) {
      const youtubeError = response.error?.details?.error;

      if (youtubeError) {
        return {
          ok: false,
          error: {
            code: youtubeError.code,
            message: youtubeError.message,
            details: youtubeError,
          },
        };
      }

      return response;
    }

    const { data } = response;

    if (data?.error) {
      return {
        ok: false,
        error: {
          code: data.error.code,
          message: data.error.message,
          details: data.error,
        },
      };
    }

    return response;
  },
});

const formatVideo = (video) => {
  const {
    id,
    snippet = {},
    statistics = {},
    contentDetails = {},
  } = video;

  return {
    id,
    title: snippet.title,
    description: snippet.description,
    publishedAt: snippet.publishedAt,
    thumbnails: snippet.thumbnails,
    viewCount: statistics.viewCount,
    likeCount: statistics.likeCount,
    commentCount: statistics.commentCount,
    duration: contentDetails.duration,
  };
};

const validatorsByArg = {
  credsPayload: credsValidator,
  channelIdentifier: Boolean,
};

const youtubeChannelVideosGet = async (
  credsPayload,
  channelIdentifier,
  {
    maxVideos,
    inspect = false,
  } = {},
) => {

  const rejectResponse = await responseIfRejectingArgs(validatorsByArg, {
    credsPayload,
    channelIdentifier,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);
  const fetchContext = { creds };

  const { handle, channelId: parsedChannelId } = parseChannelIdentifier(channelIdentifier);
  let channelId = parsedChannelId;
  let uploadsPlaylistId;

  if (!channelId) {
    const channelResponse = await youtubeClient.fetch({
      url: `${ YOUTUBE_API_BASE }/channels`,
      params: {
        part: 'contentDetails',
        forHandle: handle,
      },
      context: fetchContext,
      inspect,
    });

    if (!channelResponse.ok) {
      return channelResponse;
    }

    const channel = channelResponse.data?.items?.[0];
    channelId = channel?.id;
    uploadsPlaylistId = channel?.contentDetails?.relatedPlaylists?.uploads;

    if (!channelId) {
      return {
        ok: false,
        error: {
          code: 'CHANNEL_NOT_FOUND',
          message: `No channel found for handle @${ handle }`,
        },
      };
    }
  }

  if (!uploadsPlaylistId) {
    const channelDetailsResponse = await youtubeClient.fetch({
      url: `${ YOUTUBE_API_BASE }/channels`,
      params: {
        part: 'contentDetails',
        id: channelId,
      },
      context: fetchContext,
      inspect,
    });

    if (!channelDetailsResponse.ok) {
      return channelDetailsResponse;
    }

    uploadsPlaylistId = channelDetailsResponse.data?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  }

  if (!uploadsPlaylistId) {
    return {
      ok: false,
      error: {
        code: 'UPLOADS_PLAYLIST_NOT_FOUND',
        message: `No uploads playlist found for channel ${ channelId }`,
      },
    };
  }

  const videoIds = [];
  let nextPageToken;

  while (true) {
    const playlistResponse = await youtubeClient.fetch({
      url: `${ YOUTUBE_API_BASE }/playlistItems`,
      params: {
        part: 'contentDetails',
        playlistId: uploadsPlaylistId,
        maxResults: 50,
        ...(nextPageToken ? { pageToken: nextPageToken } : {}),
      },
      context: fetchContext,
      inspect,
    });

    if (!playlistResponse.ok) {
      return playlistResponse;
    }

    const pageVideoIds = (playlistResponse.data?.items ?? [])
      .map((item) => item.contentDetails?.videoId)
      .filter(Boolean);

    videoIds.push(...pageVideoIds);

    if (maxVideos && videoIds.length >= maxVideos) {
      videoIds.splice(maxVideos);
      break;
    }

    nextPageToken = playlistResponse.data?.nextPageToken;

    if (!nextPageToken) {
      break;
    }
  }

  if (!videoIds.length) {
    return {
      ok: true,
      data: {
        channelId,
        videos: [],
      },
    };
  }

  const videos = [];

  for (let index = 0; index < videoIds.length; index += 50) {
    const batchIds = videoIds.slice(index, index + 50).join(',');

    const videosResponse = await youtubeClient.fetch({
      url: `${ YOUTUBE_API_BASE }/videos`,
      params: {
        part: 'snippet,statistics,contentDetails',
        id: batchIds,
      },
      context: fetchContext,
      inspect,
    });

    if (!videosResponse.ok) {
      return videosResponse;
    }

    videos.push(
      ...(videosResponse.data?.items ?? []).map(formatVideo),
    );
  }

  return {
    ok: true,
    data: {
      channelId,
      videos,
    },
  };
};

const funcApiConfig = {
  argNames: ['credsPayload', 'channelIdentifier'],
  validatorsByArg,
};

module.exports = {
  youtubeChannelVideosGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/youtubeChannelVideosGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "youtube" },
    "channelIdentifier": "https://www.youtube.com/________",
    "options": { "maxVideos": 5 }
  }'
*/
