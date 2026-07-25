// https://developers.google.com/youtube/v3/guides/implementation/videos

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { youtubeClient } = require('../youtube/youtube.utils');

const parseChannelHandle = (channelHandle) => {
  const trimmed = channelHandle.trim();

  if (trimmed.startsWith('@')) {
    return trimmed.slice(1);
  }

  return trimmed;
};

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

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['channelHandle'],
]);

const youtubeChannelVideosGet = async (
  credsPayload,
  channelHandle,
  {
    maxVideos,
    inspect = false,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    channelHandle,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const handle = parseChannelHandle(channelHandle);

  const channelResponse = await youtubeClient.fetch({
    requestPayload: {
      url: '/channels',
      params: {
        part: 'contentDetails',
        forHandle: handle,
      },
    },
    context: { credsPayload },
    inspect,
  });

  if (!channelResponse.ok) {
    return channelResponse;
  }

  const channel = channelResponse.data?.items?.[0];
  const channelId = channel?.id;
  const uploadsPlaylistId = channel?.contentDetails?.relatedPlaylists?.uploads;

  if (!channelId) {
    return {
      ok: false,
      error: {
        code: 'CHANNEL_NOT_FOUND',
        message: `No channel found for handle @${ handle }`,
      },
    };
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
      requestPayload: {
        url: '/playlistItems',
        params: {
          part: 'contentDetails',
          playlistId: uploadsPlaylistId,
          maxResults: 50,
          ...(nextPageToken ? { pageToken: nextPageToken } : {}),
        },
      },
      context: { credsPayload },
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
      requestPayload: {
        url: '/videos',
        params: {
          part: 'snippet,statistics,contentDetails',
          id: batchIds,
        },
      },
      context: { credsPayload },
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
  argsWarden,
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
    "channelHandle": "garyseconomics",
    "options": { "maxVideos": 5 }
  }'
*/
