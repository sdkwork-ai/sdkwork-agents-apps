/// Profile identity port for the Agents Flutter mobile root.
///
/// The composition root implements this over the authenticated application
/// session. A capability package never reads credentials or host storage
/// directly.
library;

import '../models/profile_models.dart';

abstract class AgentsProfileIdentitySource {
  Future<AgentsProfileIdentity> load();
}
