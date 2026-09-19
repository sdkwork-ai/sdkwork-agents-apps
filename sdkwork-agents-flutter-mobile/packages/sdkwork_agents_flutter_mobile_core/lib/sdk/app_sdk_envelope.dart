/// Envelope unwrapping helpers for the generated Agents app SDK.
///
/// The generator emits list operations with an `SdkWorkApiResponse` envelope
/// (`{ code, data, traceId }`). Two payload shapes exist: `SdkWorkPageData`
/// (`items` + `pageInfo`) for listings and `SdkWorkResourceData` (`item`) for
/// single resources. Capability services stay structural about record fields,
/// but the *envelope* is generator-owned and typed, so it is unwrapped once
/// here instead of being re-parsed in every capability package.
///
/// Authority: `APP_SDK_INTEGRATION_SPEC.md`, `PAGINATION_SPEC.md`.
library;

import 'package:sdkwork_agents_app_sdk/sdkwork_agents_app_sdk.dart';

/// Reads the paged payload of a list response, or `null` when the envelope
/// carries a single-resource payload instead.
SdkWorkPageData? sdkworkAgentsPageData(Object? data) {
  final map = sdkworkAgentsAsMap(data);
  if (map == null || !map.containsKey('items') || sdkworkAgentsAsMap(map['pageInfo']) == null) {
    return null;
  }
  return SdkWorkPageData.fromJson(map);
}

/// Reads the single-resource payload of a retrieve/create response, or `null`
/// when the envelope carries a paged payload instead.
Map<String, dynamic>? sdkworkAgentsResourceItem(Object? data) {
  final map = sdkworkAgentsAsMap(data);
  if (map == null) {
    return null;
  }
  return sdkworkAgentsAsMap(map['item']);
}

/// Narrows an envelope field to a JSON object.
Map<String, dynamic>? sdkworkAgentsAsMap(Object? value) {
  if (value is Map<String, dynamic>) {
    return value;
  }
  if (value is Map) {
    return value.map<String, dynamic>(
      (Object? key, Object? item) => MapEntry<String, dynamic>(key.toString(), item),
    );
  }
  return null;
}

/// Narrows an envelope field to a JSON array of objects.
List<Map<String, dynamic>> sdkworkAgentsAsMapList(Object? value) {
  if (value is! List) {
    return const <Map<String, dynamic>>[];
  }
  final result = <Map<String, dynamic>>[];
  for (final entry in value) {
    final map = sdkworkAgentsAsMap(entry);
    if (map != null) {
      result.add(map);
    }
  }
  return result;
}

/// Reads a string field, tolerating int64 fields that arrive as numbers.
///
/// `API_SPEC.md` section 13.6 requires int64 wire fields to be strings; this
/// helper exists for records the generator typed as `dynamic`, and never
/// widens the value to `num`.
String? sdkworkAgentsAsString(Object? value) {
  if (value == null) {
    return null;
  }
  if (value is String) {
    return value;
  }
  if (value is num || value is bool) {
    return value.toString();
  }
  return null;
}

/// Extracts the paged items of a list envelope as structural maps.
List<Map<String, dynamic>> sdkworkAgentsPageItems(Object? data) {
  final page = sdkworkAgentsPageData(data);
  if (page == null) {
    return const <Map<String, dynamic>>[];
  }
  return sdkworkAgentsAsMapList(page.items);
}
